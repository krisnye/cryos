import { Database } from "@adobe/data/ecs";
import { Vec3, Quat } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import { TypedBuffer, copyToGPUBuffer, createStructBuffer } from "@adobe/data/typed-buffer";
import { voxelVolumes } from "../old-voxel-volumes/index.js";
import { scene } from "../scene.js";
import { rgbaVolumeToVertexData } from "./rgba-volume-to-vertex-data.js";
import { PositionColorNormalVertex } from "../../types/vertices/position-color-normal/index.js";
import { Volume, Rgba } from "../../types/index.js";
import instancedShaderSource from "./instanced-models.wgsl.js";

// Instanced transform data schema (per-instance vertex attributes)
const instanceTransformSchema = {
    type: "object",
    properties: {
        position: Vec3.schema,
        scale: Vec3.schema,
        rotation: Quat.schema,
    },
    required: ["position", "scale", "rotation"],
    additionalProperties: false,
    layout: "packed",
} as const satisfies Schema;

// Type for grouped model instances
type ModelGroup = {
    vertices: GPUBuffer;          // Shared vertex buffer (geometry)
    instanceCount: number;       // Number of instances
    positions: Vec3[];          // Instance transform data
    scales: Vec3[];
    rotations: Quat[];
};

export const voxelVolumeRendering = Database.Plugin.create({
    extends: Database.Plugin.combine(voxelVolumes, scene),
    components: {
        vertexData: { default: null as unknown as TypedBuffer<PositionColorNormalVertex> },
        voxelVertexSource: { default: null as unknown as Volume<Rgba> },
        modelVertexBuffer: { default: null as unknown as GPUBuffer, transient: true }, // GPUBuffer is not serializable
        modelVertexBufferSource: { default: null as unknown as TypedBuffer<PositionColorNormalVertex> },
    },
    systems: {
        generateVertexData: {
            create: (db) => {
                // Cache computed vertex data by voxelColor identity (in closure)
                // Multiple entities can share the same voxelColor and thus the same vertexData
                const vertexDataCache = new Map<Volume<Rgba>, TypedBuffer<PositionColorNormalVertex>>();

                return () => {
                    // Query entities with voxelColor component (VoxelVolume archetype)
                    const voxelTables = db.store.queryArchetypes(["position", "scale", "rotation", "voxelColor", "centerOfMass"]);

                    for (const table of voxelTables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const voxelColor = table.columns.voxelColor?.get(i) as Volume<Rgba> | undefined;
                            const centerOfMass = table.columns.centerOfMass?.get(i) as Vec3 | undefined;

                            if (!voxelColor) continue;

                            // Check current vertex source using get() for single component
                            const currentVertexSource = db.store.get(entityId, "voxelVertexSource") as Volume<Rgba> | undefined;

                            // Check if we need to regenerate vertex data (object identity changed)
                            if (currentVertexSource !== voxelColor) {
                                // Get or compute vertex data (cached by voxelColor identity)
                                let vertexData = vertexDataCache.get(voxelColor);

                                if (!vertexData) {
                                    // Convert voxel volume to vertex data (CPU-side operation)
                                    vertexData = rgbaVolumeToVertexData(voxelColor, { center: centerOfMass });
                                    vertexDataCache.set(voxelColor, vertexData);
                                }

                                // Store both the vertex data and track the source
                                db.store.update(entityId, {
                                    vertexData,
                                    voxelVertexSource: voxelColor,
                                });
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
        createVertexBuffers: {
            create: (db) => {
                // Cache GPU buffers by vertexData identity (in closure)
                const bufferCache = new Map<TypedBuffer<PositionColorNormalVertex>, {
                    buffer: GPUBuffer;
                    refCount: number;
                }>();

                // Track which entities are using which vertexData (by identity)
                const entityToVertexData = new Map<number, TypedBuffer<PositionColorNormalVertex>>();

                return () => {
                    const device = db.store.resources.device;
                    if (!device) return; // Skip if no GPU device available

                    // Query all entities that have vertexData
                    const tables = db.store.queryArchetypes(["vertexData"]);

                    for (const table of tables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const vertexData = table.columns.vertexData?.get(i) as TypedBuffer<PositionColorNormalVertex> | undefined;

                            if (!vertexData) continue;

                            // Check if vertexData has changed (by object identity)
                            // We track this separately from the component to handle entities moving between tables
                            const oldVertexData = entityToVertexData.get(entityId);

                            if (oldVertexData !== vertexData) {
                                // Vertex data changed - update GPU buffer

                                // Release old buffer if it exists
                                if (oldVertexData !== undefined) {
                                    const oldEntry = bufferCache.get(oldVertexData);
                                    if (oldEntry) {
                                        oldEntry.refCount--;
                                        if (oldEntry.refCount === 0) {
                                            // No more references - destroy and remove from cache
                                            oldEntry.buffer.destroy();
                                            bufferCache.delete(oldVertexData);
                                        }
                                    }
                                }

                                // Get or create cached GPU buffer for this vertexData
                                let cacheEntry = bufferCache.get(vertexData);

                                if (!cacheEntry) {
                                    // Create new GPU buffer
                                    const dataArray = vertexData.getTypedArray();
                                    const gpuBuffer = device.createBuffer({
                                        size: dataArray.byteLength,
                                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                                        mappedAtCreation: false
                                    });

                                    // Copy data to GPU
                                    const finalBuffer = copyToGPUBuffer(vertexData, device, gpuBuffer);

                                    cacheEntry = {
                                        buffer: finalBuffer,
                                        refCount: 0
                                    };

                                    bufferCache.set(vertexData, cacheEntry);
                                }

                                // Increment reference count
                                cacheEntry.refCount++;

                                // Update entity tracking
                                entityToVertexData.set(entityId, vertexData);

                                // Update entity with GPU buffer and track the source
                                db.store.update(entityId, {
                                    modelVertexBuffer: cacheEntry.buffer,
                                    modelVertexBufferSource: vertexData,
                                });
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
        renderVoxelVolumes: {
            create: (db) => {
                // Pipeline state - initialized once when device is available (in closure)
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;

                // Reusable buffers - retained across iterations and system calls (in closure)
                const instanceDataBuffer = createStructBuffer(instanceTransformSchema, 1); // Start with capacity 1
                // Map of vertex buffer to GPU buffer for each group (in closure)
                const groupGpuBuffers = new Map<GPUBuffer, GPUBuffer>();

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, depthTexture } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer) return;

                    // Query entities with modelVertexBuffer component
                    const renderTables = db.store.queryArchetypes(["modelVertexBuffer", "position", "scale", "rotation"]);

                    // Group entities by vertex buffer (model type)
                    const modelGroups = new Map<GPUBuffer, ModelGroup>();

                    for (const table of renderTables) {
                        const entityCount = table.rowCount;

                        // Extract per-entity data directly
                        for (let i = 0; i < entityCount; i++) {
                            const vertexBuffer = table.columns.modelVertexBuffer?.get(i) as GPUBuffer | undefined;
                            const position = table.columns.position.get(i);
                            const scale = table.columns.scale.get(i);
                            const rotation = table.columns.rotation.get(i);

                            if (!vertexBuffer) continue;

                            // Initialize group if needed
                            if (!modelGroups.has(vertexBuffer)) {
                                modelGroups.set(vertexBuffer, {
                                    vertices: vertexBuffer,
                                    instanceCount: 0,
                                    positions: [],
                                    scales: [],
                                    rotations: []
                                });
                            }

                            const group = modelGroups.get(vertexBuffer)!;

                            // Add instance data
                            group.positions.push(position);
                            group.scales.push(scale);
                            group.rotations.push(rotation);
                            group.instanceCount++;
                        }
                    }

                    if (modelGroups.size === 0) return;

                    // Initialize pipeline once if needed
                    bindGroupLayout ??= device.createBindGroupLayout({
                        entries: [{
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                            buffer: { type: 'uniform' }
                        }]
                    });

                    pipeline ??= device.createRenderPipeline({
                        layout: device.createPipelineLayout({
                            bindGroupLayouts: [bindGroupLayout]
                        }),
                        vertex: {
                            module: device.createShaderModule({ code: instancedShaderSource }),
                            entryPoint: 'vertexMain',
                            buffers: [
                                // Buffer 0: Geometry data (PositionColorNormalVertex)
                                {
                                    arrayStride: 40, // 3*4 + 4*4 + 3*4 + 4 (padding) = 40 bytes
                                    attributes: [
                                        { shaderLocation: 0, format: 'float32x3', offset: 0 },    // position
                                        { shaderLocation: 1, format: 'float32x4', offset: 12 },   // color  
                                        { shaderLocation: 2, format: 'float32x3', offset: 28 },   // normal
                                    ]
                                },
                                // Buffer 1: Instance data (InstanceTransform)
                                {
                                    arrayStride: 40, // 3*4 + 3*4 + 4*4 = 40 bytes  
                                    stepMode: 'instance',
                                    attributes: [
                                        { shaderLocation: 4, format: 'float32x3', offset: 0 },  // instancePosition
                                        { shaderLocation: 5, format: 'float32x3', offset: 12 },   // instanceScale
                                        { shaderLocation: 6, format: 'float32x4', offset: 24 },   // instanceRotation
                                    ]
                                }
                            ]
                        },
                        fragment: {
                            module: device.createShaderModule({ code: instancedShaderSource }),
                            entryPoint: 'fragmentMain',
                            targets: [{ format: 'bgra8unorm' }] // Default format
                        },
                        primitive: {
                            topology: 'triangle-list',
                            cullMode: 'back'
                        },
                        depthStencil: {
                            depthWriteEnabled: true,
                            depthCompare: 'less',
                            format: depthTexture?.format ?? 'depth24plus'
                        }
                    });

                    // Process each model group for instanced rendering
                    for (const [vertexBuffer, group] of modelGroups) {
                        // Ensure typed buffer has sufficient capacity
                        if (instanceDataBuffer.capacity < group.instanceCount) {
                            instanceDataBuffer.capacity = group.instanceCount;
                        }

                        // Populate instance data
                        for (let i = 0; i < group.instanceCount; i++) {
                            instanceDataBuffer.set(i, {
                                position: group.positions[i],
                                scale: group.scales[i],
                                rotation: group.rotations[i]
                            });
                        }

                        // Get or create GPU buffer for this specific group
                        let gpuBuffer = groupGpuBuffers.get(vertexBuffer);
                        const instanceDataArray = instanceDataBuffer.getTypedArray();

                        if (!gpuBuffer || gpuBuffer.size < instanceDataArray.byteLength) {
                            gpuBuffer = device.createBuffer({
                                size: instanceDataArray.byteLength,
                                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                                mappedAtCreation: false
                            });
                            groupGpuBuffers.set(vertexBuffer, gpuBuffer);
                        }

                        // Copy typed data to GPU buffer
                        gpuBuffer = copyToGPUBuffer(instanceDataBuffer, device, gpuBuffer);

                        // Set up vertex buffers (one for geometry, one for instance data)
                        renderPassEncoder.setVertexBuffer(0, vertexBuffer, 0);
                        renderPassEncoder.setVertexBuffer(1, gpuBuffer, 0);

                        // Set up pipeline and bind group
                        renderPassEncoder.setPipeline(pipeline!);

                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout!,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } }
                            ]
                        });

                        renderPassEncoder.setBindGroup(0, bindGroup);

                        const vertexCount = vertexBuffer.size / PositionColorNormalVertex.layout.size;
                        // Execute instanced draw call - use actual vertex count
                        renderPassEncoder.draw(vertexCount, group.instanceCount, 0, 0);
                    }
                };
            },
            schedule: { during: ["render"] },
        },
    },
});

