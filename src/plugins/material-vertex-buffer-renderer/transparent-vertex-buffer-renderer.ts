import { Database } from "@adobe/data/ecs";
import { createStructBuffer } from "@adobe/data/typed-buffer";
import {
    instanceTransformSchema,
    queryAndGroupEntities,
    getOrCreateBindGroupLayout,
    getOrCreatePipeline,
    renderGroup,
    type PipelineConfig
} from "./render-helpers.js";
import { baseVertexBufferRenderer } from "./base-vertex-buffer-renderer.js";

/**
 * System that renders transparent vertex buffers using instanced rendering.
 * Groups entities by shared vertex buffer and batches them into single draw calls.
 * Generic renderer - works with any entity that has transparentVertexBuffer component.
 * TODO: Phase 3 of transparent epic will add depth sorting for back-to-front rendering.
 */
export const renderTransparentVertexBuffers = Database.Plugin.create({
    extends: baseVertexBufferRenderer,
    systems: {
        renderTransparentVertexBuffers: {
            create: (db) => {
                // Pipeline state - initialized once when device is available (in closure)
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;

                // Reusable buffers - retained across iterations and system calls (in closure)
                const instanceDataBuffer = createStructBuffer(instanceTransformSchema, 1); // Start with capacity 1
                // Map of vertex buffer to GPU buffer for each group (in closure)
                const groupGpuBuffers = new Map<GPUBuffer, GPUBuffer>();

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvasFormat } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query and group entities by vertex buffer
                    const modelGroups = queryAndGroupEntities(db.store, "transparentVertexBuffer");
                    if (modelGroups.size === 0) return;

                    // Initialize pipeline once if needed
                    bindGroupLayout = getOrCreateBindGroupLayout(device, bindGroupLayout);
                    
                    const pipelineConfig: PipelineConfig = {
                        depthWriteEnabled: false,
                        fragmentTarget: {
                            format: canvasFormat,
                            blend: {
                                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                            }
                        }
                    };
                    pipeline = getOrCreatePipeline(device, pipeline, bindGroupLayout, pipelineConfig);

                    // Render each model group
                    for (const [vertexBuffer, group] of modelGroups) {
                        renderGroup(
                            device,
                            renderPassEncoder,
                            sceneUniformsBuffer,
                            materialsGpuBuffer,
                            bindGroupLayout,
                            pipeline,
                            vertexBuffer,
                            group,
                            instanceDataBuffer,
                            groupGpuBuffers
                        );
                    }
                };
            },
            schedule: { 
                during: ["render"]
                // Will run after opaque systems due to plugin combination order
            }
        },
    },
});

