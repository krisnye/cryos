import { Database } from "@adobe/data/ecs";
import { Vec3, Quat } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import { TypedBuffer, createStructBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { scene } from "../scene.js";
import { materials } from "../materials.js";
import { createVertexBuffers } from "./create-vertex-buffers.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
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

/**
 * System that renders volume models using instanced rendering.
 * Groups entities by shared vertex buffer and batches them into single draw calls.
 */
export const renderVolumeModels = Database.Plugin.create({
    extends: Database.Plugin.combine(createVertexBuffers, scene, materials),
    systems: {
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

