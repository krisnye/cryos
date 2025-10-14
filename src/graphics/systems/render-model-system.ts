import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { Vec3, Quat } from "@adobe/data/math";
import { createStructBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { Schema, FromSchema } from "@adobe/data/schema";
import { positionColorNormalVertexLayout } from "graphics/vertices/position-color-normal.js";
import instancedShaderSource from './instanced-models.js';

/**
 * Instanced transform data schema (per-instance vertex attributes)
 */
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

type InstanceTransform = FromSchema<typeof instanceTransformSchema>;

/**
 * System that renders RenderModel entities.
 * 
 * Stages:
 * 1. ✅ Query RenderModel entities and group by vertex buffer
 * 2. ✅ Create instanced buffers and prepare rendering
 * 3. ⏳ Bind buffers and execute instanced draw calls
 */
// Type for grouped model instances
type ModelGroup = {
    vertices: GPUBuffer;          // Shared vertex buffer (geometry)
    instanceCount: number;       // Number of instances
    positions: Vec3[];          // Instance transform data
    scales: Vec3[];
    rotations: Quat[];
};

export const renderModelSystem : SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    
    // Pipeline state - initialized once when device is available
    let bindGroupLayout: GPUBindGroupLayout | null = null;
    let pipeline: GPURenderPipeline | null = null;
    
    // Reusable buffers - retained across iterations and system calls
    let instanceDataBuffer = createStructBuffer(instanceTransformSchema, 1); // Start with capacity 1
    // Map of vertex buffer to GPU buffer for each group
    const groupGpuBuffers = new Map<GPUBuffer, GPUBuffer>();

    return [{
        name: "renderModelSystem",
        phase: "render",
        run: () => {
            const {device, renderPassEncoder} = store.resources;
            const activeViewport = store.read(store.resources.activeViewport, store.archetypes.Viewport);
            if (!device || !renderPassEncoder || !activeViewport) return;

            // Stage 1: Group RenderModel entities by vertex buffer + extract instance data
            const renderTables = store.queryArchetypes(store.archetypes.RenderModel.components);
                        
            // Group entities by vertex buffer (model type)
            const modelGroups = new Map<GPUBuffer, ModelGroup>();
            let totalEntities = 0;
            
            for (const table of renderTables) {
                const entityCount = table.rowCount;
                totalEntities += entityCount;
                
                // Extract per-entity data directly
                for (let i = 0; i < entityCount; i++) {
                    const vertexBuffer = table.columns.modelVertexBuffer.get(i);
                    const position = table.columns.position.get(i);
                    const scale = table.columns.scale.get(i);
                    const rotation = table.columns.rotation.get(i);

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
                        
            // Stage 2 & 3: Create instanced buffers and prepare rendering
            
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
                    format: activeViewport.depthTexture.format
                }
            });
            
            // Process each model group for instanced rendering
            for (const [vertexBuffer, group] of modelGroups) {
                // Ensure typed buffer has sufficient capacity
                if (instanceDataBuffer.capacity < group.instanceCount) {
                    instanceDataBuffer.capacity = group.instanceCount;
                }
                
                // Clear the buffer before populating (critical!)
                for (let i = 0; i < instanceDataBuffer.capacity; i++) {
                    instanceDataBuffer.set(i, { position: [0, 0, 0], scale: [0, 0, 0], rotation: [0, 0, 0, 1] });
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

                // // Set up vertex buffers (one for geometry, one for instance data)
                renderPassEncoder.setVertexBuffer(0, vertexBuffer, 0);
                renderPassEncoder.setVertexBuffer(1, gpuBuffer, 0);
                
                // Set up pipeline and bind group
                renderPassEncoder.setPipeline(pipeline);

                const bindGroup = device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        { binding: 0, resource: { buffer: activeViewport.sceneUniformsBuffer } }
                    ]
                });

                renderPassEncoder.setBindGroup(0, bindGroup);

                const vertexCount = vertexBuffer.size / positionColorNormalVertexLayout.size;
                // Execute instanced draw call - use actual vertex count
                renderPassEncoder.draw(vertexCount, group.instanceCount, 0, 0);
            }
        },
        dispose: () => {
            // Clean up pipeline state
            bindGroupLayout = null;
            pipeline = null;
            
            // Clean up all group GPU buffers
            for (const gpuBuffer of groupGpuBuffers.values()) {
                gpuBuffer.destroy();
            }
            groupGpuBuffers.clear();
        }
    }]
}
