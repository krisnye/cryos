import { GraphicsService } from "graphics/graphics-service.js";
import { SystemFactory } from "systems/system-factory.js";
import { createStructGPUBuffer } from "graphics/create-struct-gpu-buffer.js";
import { Vec3, Vec4, Quat } from "@adobe/data/math";
import shaderSource from './voxels.wgsl?raw';
import { copyColumnToGPUBuffer } from "@adobe/data/table";

// Schema for voxel data structures
const VoxelPositionSchema = Vec3.schema;
const VoxelColorSchema = Vec4.schema;
const VoxelScaleSchema = Vec3.schema;
const VoxelRotationSchema = Quat.schema;

export const voxelRenderingSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    
    // These will be initialized when device becomes available
    let bindGroupLayout: GPUBindGroupLayout | null = null;
    let pipeline: GPURenderPipeline | null = null;
    let voxelPositionBuffer: GPUBuffer | null = null;
    let voxelColorBuffer: GPUBuffer | null = null;
    let voxelScaleBuffer: GPUBuffer | null = null;
    let voxelRotationBuffer: GPUBuffer | null = null;

    return [{
        name: "renderVoxels",
        phase: "render",
        run: () => {
            const { device, renderPassEncoder } = store.resources;
            const activeViewport = store.read(store.resources.activeViewport, store.archetypes.Viewport);
            if (!device || !renderPassEncoder || !activeViewport) return;
            
            // Initialize resources only if they don't exist
            bindGroupLayout ??= device.createBindGroupLayout({
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

            pipeline ??= device.createRenderPipeline({
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
                    targets: [{ format: 'bgra8unorm' }] // Default format, will be updated per viewport
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back'
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less-equal',
                    format: activeViewport.depthTexture.format
                }
            });

            // Initialize buffers only if they don't exist
            voxelPositionBuffer ??= createStructGPUBuffer({
                device,
                schema: VoxelPositionSchema,
                elements: [],
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });

            voxelColorBuffer ??= createStructGPUBuffer({
                device,
                schema: VoxelColorSchema,
                elements: [],
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });

            voxelScaleBuffer ??= createStructGPUBuffer({
                device,
                schema: VoxelScaleSchema,
                elements: [],
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });

            voxelRotationBuffer ??= createStructGPUBuffer({
                device,
                schema: VoxelRotationSchema,
                elements: [],
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });

            // Query for voxel entities using the Particle archetype
            const voxelTables = store.queryArchetypes(store.archetypes.Particle.components);
            if (voxelTables.length === 0) {
                return;
            }

            // Calculate total voxel count
            const voxelCount = voxelTables.reduce((acc, table) => acc + table.rowCount, 0);

            if (voxelCount > 0 && voxelPositionBuffer && voxelColorBuffer) {
                // Update GPU buffers using efficient column copying (automatically resizes as needed)
                voxelPositionBuffer = copyColumnToGPUBuffer(
                    voxelTables,
                    "position",
                    device,
                    voxelPositionBuffer
                );

                voxelColorBuffer = copyColumnToGPUBuffer(
                    voxelTables,
                    "color",
                    device,
                    voxelColorBuffer
                );

                voxelScaleBuffer = copyColumnToGPUBuffer(
                    voxelTables,
                    "scale",
                    device,
                    voxelScaleBuffer
                );

                voxelRotationBuffer = copyColumnToGPUBuffer(
                    voxelTables,
                    "rotation",
                    device,
                    voxelRotationBuffer
                );

                // Create bind group and render (must be created after buffer updates in case buffers were resized)
                if (bindGroupLayout && pipeline && voxelPositionBuffer && voxelColorBuffer) {
                    const activeViewportId = store.resources.activeViewport;
                    const activeViewport = store.read(activeViewportId, store.archetypes.Viewport);
                    if (!activeViewport?.sceneUniformsBuffer) return;

                    const bindGroup = device.createBindGroup({
                        layout: bindGroupLayout,
                        entries: [
                            { binding: 0, resource: { buffer: activeViewport.sceneUniformsBuffer } },
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
            }
        },
        dispose: () => {
            // Release GPU resources
            if (voxelPositionBuffer) {
                voxelPositionBuffer.destroy();
                voxelPositionBuffer = null;
            }
            
            if (voxelColorBuffer) {
                voxelColorBuffer.destroy();
                voxelColorBuffer = null;
            }

            if (voxelScaleBuffer) {
                voxelScaleBuffer.destroy();
                voxelScaleBuffer = null;
            }

            if (voxelRotationBuffer) {
                voxelRotationBuffer.destroy();
                voxelRotationBuffer = null;
            }
            
            // Note: bindGroupLayout and pipeline don't need explicit disposal
            // as they are automatically cleaned up when the device is destroyed
            // sceneUniformsBuffer is managed by the scene-uniforms-system
            bindGroupLayout = null;
            pipeline = null;
        }
    }];
};