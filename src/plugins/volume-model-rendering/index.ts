import { Database } from "@adobe/data/ecs";
import { Vec3, Quat } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import { TypedBuffer, copyToGPUBuffer, createStructBuffer } from "@adobe/data/typed-buffer";
import { volumeModel } from "../volume-model.js";
import { scene } from "../scene.js";
import { materials } from "../materials.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";
import instancedShaderSource from "./instanced-pbr.wgsl.js";

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

export const volumeModelRendering = Database.Plugin.create({
    extends: Database.Plugin.combine(volumeModel, scene, materials),
    components: {
        volumeModelVertexData: { default: null as unknown as TypedBuffer<PositionNormalMaterialVertex> },
        volumeModelVertexSource: { default: null as unknown as Volume<MaterialId> },
        modelVertexBuffer: { default: null as unknown as GPUBuffer, transient: true }, // GPUBuffer is not serializable
        modelVertexBufferSource: { default: null as unknown as TypedBuffer<PositionNormalMaterialVertex> },
    },
    systems: {
        generateVertexData: {
            create: (db) => {
                // Cache computed vertex data by materialVolume identity (in closure)
                // Multiple entities can share the same materialVolume and thus the same volumeModelVertexData
                const vertexDataCache = new Map<Volume<MaterialId>, TypedBuffer<PositionNormalMaterialVertex>>();

                return () => {
                    // Query entities with materialVolume component (VolumeModel archetype)
                    const volumeTables = db.store.queryArchetypes(["volumeModel", "materialVolume", "position"]);

                    for (const table of volumeTables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const materialVolume = table.columns.materialVolume?.get(i) as Volume<MaterialId> | undefined;

                            if (!materialVolume) continue;

                            // Check current vertex source using get() for single component
                            const currentVertexSource = db.store.get(entityId, "volumeModelVertexSource") as Volume<MaterialId> | undefined;

                            // Check if we need to regenerate vertex data (object identity changed)
                            if (currentVertexSource !== materialVolume) {
                                // Get or compute vertex data (cached by materialVolume identity)
                                let vertexData = vertexDataCache.get(materialVolume);

                                if (!vertexData) {
                                    // Convert volume to vertex data (CPU-side operation)
                                    // Calculate center from volume size (like old system default)
                                    const center = Vec3.scale(materialVolume.size, 0.5);
                                    vertexData = materialVolumeToVertexData(materialVolume, { center });
                                    vertexDataCache.set(materialVolume, vertexData);
                                }

                                // Store both the vertex data and track the source
                                db.store.update(entityId, {
                                    volumeModelVertexData: vertexData,
                                    volumeModelVertexSource: materialVolume,
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
                // Cache GPU buffers by volumeModelVertexData identity (in closure)
                const bufferCache = new Map<TypedBuffer<PositionNormalMaterialVertex>, {
                    buffer: GPUBuffer;
                    refCount: number;
                }>();

                // Track which entities are using which volumeModelVertexData (by identity)
                const entityToVertexData = new Map<number, TypedBuffer<PositionNormalMaterialVertex>>();

                return () => {
                    const device = db.store.resources.device;
                    if (!device) return; // Skip if no GPU device available

                    // Query all entities that have volumeModelVertexData
                    const tables = db.store.queryArchetypes(["volumeModelVertexData"]);

                    for (const table of tables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const vertexData = table.columns.volumeModelVertexData?.get(i) as TypedBuffer<PositionNormalMaterialVertex> | undefined;

                            if (!vertexData) continue;

                            // Check if volumeModelVertexData has changed (by object identity)
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

                                // Get or create cached GPU buffer for this volumeModelVertexData
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
        renderVolumeModels: {
            create: (db) => {
                // Pipeline state - initialized once when device is available (in closure)
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;

                // Reusable buffers - retained across iterations and system calls (in closure)
                const instanceDataBuffer = createStructBuffer(instanceTransformSchema, 1); // Start with capacity 1
                // Map of vertex buffer to GPU buffer for each group (in closure)
                const groupGpuBuffers = new Map<GPUBuffer, GPUBuffer>();

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, depthTexture } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query entities with modelVertexBuffer component
                    // Query for all possible combinations (with/without scale/rotation)
                    const renderTablesWithScaleRotation = db.store.queryArchetypes(["modelVertexBuffer", "position", "scale", "rotation"]);
                    const renderTablesWithScale = db.store.queryArchetypes(["modelVertexBuffer", "position", "scale"], { exclude: ["rotation"] });
                    const renderTablesWithRotation = db.store.queryArchetypes(["modelVertexBuffer", "position", "rotation"], { exclude: ["scale"] });
                    const renderTablesBase = db.store.queryArchetypes(["modelVertexBuffer", "position"], { exclude: ["scale", "rotation"] });
                    const renderTables = [...renderTablesWithScaleRotation, ...renderTablesWithScale, ...renderTablesWithRotation, ...renderTablesBase];

                    // Group entities by vertex buffer (model type)
                    const modelGroups = new Map<GPUBuffer, ModelGroup>();

                    for (const table of renderTables) {
                        const entityCount = table.rowCount;

                        // Extract per-entity data directly
                        for (let i = 0; i < entityCount; i++) {
                            const vertexBuffer = table.columns.modelVertexBuffer?.get(i) as GPUBuffer | undefined;
                            const position = table.columns.position.get(i);
                            // Default scale and rotation if not present (check if column exists in columns object)
                            const scaleColumn = 'scale' in table.columns ? (table.columns as { scale?: TypedBuffer<Vec3> }).scale : undefined;
                            const rotationColumn = 'rotation' in table.columns ? (table.columns as { rotation?: TypedBuffer<Quat> }).rotation : undefined;
                            const scale = (scaleColumn ? scaleColumn.get(i) : [1, 1, 1]) as Vec3;
                            const rotation = (rotationColumn ? rotationColumn.get(i) : [0, 0, 0, 1]) as Quat;

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
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                                buffer: { type: 'uniform' }
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                                buffer: { type: 'read-only-storage' }
                            }
                        ]
                    });

                    pipeline ??= device.createRenderPipeline({
                        layout: device.createPipelineLayout({
                            bindGroupLayouts: [bindGroupLayout]
                        }),
                        vertex: {
                            module: device.createShaderModule({ code: instancedShaderSource }),
                            entryPoint: 'vertexMain',
                            buffers: [
                                // Buffer 0: Geometry data (PositionNormalMaterialVertex)
                                {
                                    arrayStride: PositionNormalMaterialVertex.layout.size,
                                    attributes: [
                                        { shaderLocation: 0, format: 'float32x3', offset: 0 },    // position
                                        { shaderLocation: 1, format: 'float32x3', offset: 12 },   // normal
                                        { shaderLocation: 2, format: 'uint32', offset: 24 },       // materialIndex
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
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } }
                            ]
                        });

                        renderPassEncoder.setBindGroup(0, bindGroup);

                        const vertexCount = vertexBuffer.size / PositionNormalMaterialVertex.layout.size;
                        // Execute instanced draw call - use actual vertex count
                        renderPassEncoder.draw(vertexCount, group.instanceCount, 0, 0);
                    }
                };
            },
            schedule: { during: ["render"] },
        },
    },
});

