// Particle rendering plugin for particles with rotation only
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingBaseDependencies } from "./dependencies.js";
import shaderSourceRotation from './particles-rotation.wgsl.js';
import {
    createBindGroupLayout,
    createRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateRotationBuffer,
} from './render-helpers.js';

export const particleRenderingRotation = Database.Plugin.create({
    extends: particleRenderingBaseDependencies,
    systems: {
        renderParticlesRotation: {
            create: (db) => {
                // Closure variables for caching GPU objects across frames
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;
                let positionBuffer: GPUBuffer | null = null;
                let materialIndexBuffer: GPUBuffer | null = null;
                let rotationBuffer: GPUBuffer | null = null;

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvasFormat } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "rotation"], { exclude: ["scale", "transparent"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout and pipeline
                    if (!bindGroupLayout) {
                        bindGroupLayout = createBindGroupLayout(device, 1);
                    }

                    if (!pipeline && bindGroupLayout) {
                        pipeline = createRenderPipeline(device, bindGroupLayout, shaderSourceRotation, canvasFormat);
                    }

                    // Initialize and update buffers
                    positionBuffer = getOrCreatePositionBuffer(device, positionBuffer);
                    materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, materialIndexBuffer);
                    rotationBuffer = getOrCreateRotationBuffer(device, rotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && rotationBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: rotationBuffer } }
                            ]
                        });

                        renderPassEncoder.setPipeline(pipeline);
                        renderPassEncoder.setBindGroup(0, bindGroup);
                        renderPassEncoder.draw(36, particleCount, 0, 0);
                    }
                };
            },
            schedule: { during: ["render"] }
        },
    },
});

