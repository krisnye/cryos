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
 * System that renders opaque vertex buffers using instanced rendering.
 * Groups entities by shared vertex buffer and batches them into single draw calls.
 * Generic renderer - works with any entity that has opaqueVertexBuffer component.
 */
export const renderOpaqueVertexBuffers = Database.Plugin.create({
    extends: baseVertexBufferRenderer,
    systems: {
        renderOpaqueVertexBuffers: {
            create: (db) => {
                // Pipeline state - initialized once when device is available (in closure)
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;

                // Reusable buffers - retained across iterations and system calls (in closure)
                const instanceDataBuffer = createStructBuffer(instanceTransformSchema, 1); // Start with capacity 1
                // Map of vertex buffer to GPU buffer for each group (in closure)
                const groupGpuBuffers = new Map<GPUBuffer, GPUBuffer>();

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, depthTexture, canvasFormat } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !depthTexture) return;

                    // Query and group entities by vertex buffer
                    const modelGroups = queryAndGroupEntities(db.store, "opaqueVertexBuffer");
                    if (modelGroups.size === 0) return;

                    // Initialize pipeline once if needed
                    bindGroupLayout = getOrCreateBindGroupLayout(device, bindGroupLayout);
                    
                    const pipelineConfig: PipelineConfig = {
                        depthWriteEnabled: true,
                        fragmentTarget: { format: canvasFormat }
                    };
                    pipeline = getOrCreatePipeline(device, pipeline, bindGroupLayout, pipelineConfig, depthTexture);

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
            schedule: { during: ["render"] },
        },
    },
});

