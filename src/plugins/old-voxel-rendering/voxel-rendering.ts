import { Database } from "@adobe/data/ecs";
import { Vec3, Vec4, Quat } from "@adobe/data/math";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { voxels } from "../old-voxels.js";
import { scene } from "../scene.js";
import { SchemaX } from "../../types/index.js";
import shaderSource from './voxels.wgsl.js';

// Schema for voxel data structures
const VoxelPositionSchema = Vec3.schema;
const VoxelColorSchema = Vec4.schema;
const VoxelScaleSchema = Vec3.schema;
const VoxelRotationSchema = Quat.schema;

export const voxelRendering = Database.Plugin.create({
    resources: {
        // GPU rendering resources (lazy initialized)
        voxelBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        voxelPipeline: { default: null as GPURenderPipeline | null },
        voxelPositionBuffer: { default: null as GPUBuffer | null },
        voxelColorBuffer: { default: null as GPUBuffer | null },
        voxelScaleBuffer: { default: null as GPUBuffer | null },
        voxelRotationBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderVoxels: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer) return;

                    // Initialize bind group layout if needed
                    let bindGroupLayout = db.store.resources.voxelBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.voxelBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                {
                                    binding: 0,
                                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                                    buffer: { type: 'uniform' }
                                },
                                {
                                    binding: 1,
                                    visibility: GPUShaderStage.VERTEX,
                                    buffer: { type: 'read-only-storage' }
                                },
                                {
                                    binding: 2,
                                    visibility: GPUShaderStage.VERTEX,
                                    buffer: { type: 'read-only-storage' }
                                },
                                {
                                    binding: 3,
                                    visibility: GPUShaderStage.VERTEX,
                                    buffer: { type: 'read-only-storage' }
                                },
                                {
                                    binding: 4,
                                    visibility: GPUShaderStage.VERTEX,
                                    buffer: { type: 'read-only-storage' }
                                },
                            ]
                        });
                    }

                    // Initialize pipeline if needed
                    let pipeline = db.store.resources.voxelPipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.voxelPipeline = device.createRenderPipeline({
                            layout: device.createPipelineLayout({
                                bindGroupLayouts: [bindGroupLayout]
                            }),
                            vertex: {
                                module: device.createShaderModule({ code: shaderSource }),
                                entryPoint: 'vertexMain'
                            },
                            fragment: {
                                module: device.createShaderModule({ code: shaderSource }),
                                entryPoint: 'fragmentMain',
                                targets: [{
                                    format: navigator.gpu.getPreferredCanvasFormat(),
                                    blend: {
                                        color: {
                                            srcFactor: 'src-alpha',
                                            dstFactor: 'one-minus-src-alpha',
                                            operation: 'add'
                                        },
                                        alpha: {
                                            srcFactor: 'one',
                                            dstFactor: 'one-minus-src-alpha',
                                            operation: 'add'
                                        }
                                    }
                                }]
                            },
                            primitive: {
                                topology: 'triangle-list',
                                cullMode: 'back'
                            },
                            depthStencil: {
                                depthWriteEnabled: true,
                                depthCompare: 'less-equal',
                                format: 'depth24plus'
                            }
                        });
                    }

                    // Query for voxel entities using the Voxel archetype components
                    const voxelTables = db.store.queryArchetypes(["voxel", "position", "color", "scale", "rotation"]);
                    if (voxelTables.length === 0) {
                        return;
                    }

                    // Calculate total voxel count
                    const voxelCount = voxelTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (voxelCount === 0) return;

                    // Initialize buffers if needed
                    let voxelPositionBuffer = db.store.resources.voxelPositionBuffer;
                    if (!voxelPositionBuffer) {
                        voxelPositionBuffer = db.store.resources.voxelPositionBuffer = SchemaX.createStructGPUBuffer(
                            VoxelPositionSchema, {
                            device,
                            elements: [],
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let voxelColorBuffer = db.store.resources.voxelColorBuffer;
                    if (!voxelColorBuffer) {
                        voxelColorBuffer = db.store.resources.voxelColorBuffer = SchemaX.createStructGPUBuffer(
                            VoxelColorSchema, {
                            device,
                            elements: [],
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let voxelScaleBuffer = db.store.resources.voxelScaleBuffer;
                    if (!voxelScaleBuffer) {
                        voxelScaleBuffer = db.store.resources.voxelScaleBuffer = SchemaX.createStructGPUBuffer(
                            VoxelScaleSchema,{
                            device,
                            elements: [],
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let voxelRotationBuffer = db.store.resources.voxelRotationBuffer;
                    if (!voxelRotationBuffer) {
                        voxelRotationBuffer = db.store.resources.voxelRotationBuffer = SchemaX.createStructGPUBuffer(
                            VoxelRotationSchema, {
                            device,
                            elements: [],
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    // Update GPU buffers using efficient column copying (automatically resizes as needed)
                    voxelPositionBuffer = copyColumnToGPUBuffer(
                        voxelTables,
                        "position",
                        device,
                        voxelPositionBuffer
                    );
                    db.store.resources.voxelPositionBuffer = voxelPositionBuffer;

                    voxelColorBuffer = copyColumnToGPUBuffer(
                        voxelTables,
                        "color",
                        device,
                        voxelColorBuffer
                    );
                    db.store.resources.voxelColorBuffer = voxelColorBuffer;

                    voxelScaleBuffer = copyColumnToGPUBuffer(
                        voxelTables,
                        "scale",
                        device,
                        voxelScaleBuffer
                    );
                    db.store.resources.voxelScaleBuffer = voxelScaleBuffer;

                    voxelRotationBuffer = copyColumnToGPUBuffer(
                        voxelTables,
                        "rotation",
                        device,
                        voxelRotationBuffer
                    );
                    db.store.resources.voxelRotationBuffer = voxelRotationBuffer;

                    // Create bind group and render (must be created after buffer updates in case buffers were resized)
                    if (bindGroupLayout && pipeline && voxelPositionBuffer && voxelColorBuffer && voxelScaleBuffer && voxelRotationBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: voxelPositionBuffer } },
                                { binding: 2, resource: { buffer: voxelColorBuffer } },
                                { binding: 3, resource: { buffer: voxelScaleBuffer } },
                                { binding: 4, resource: { buffer: voxelRotationBuffer } }
                            ]
                        });

                        renderPassEncoder.setPipeline(pipeline);
                        renderPassEncoder.setBindGroup(0, bindGroup);
                        renderPassEncoder.draw(36, voxelCount, 0, 0); // 36 vertices per cube, voxelCount instances
                    }
                };
            },
            schedule: { during: ["render"] }
        }
    },
    extends: Database.Plugin.combine(voxels, scene)
});

