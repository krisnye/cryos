// Particle rendering plugin for particles with both scale and rotation
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingBaseDependencies } from "./dependencies.js";
import shaderSourceScaleRotation from './particles-scale-rotation.wgsl.js';
import {
    createBindGroupLayout,
    createRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateScaleBuffer,
    getOrCreateRotationBuffer,
} from './render-helpers.js';

export const particleRenderingScaleRotation = Database.Plugin.create({
    extends: particleRenderingBaseDependencies,
    systems: {
        renderParticlesScaleRotation: {
            create: (db) => {
                // Closure variables for caching GPU objects across frames
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;
                let positionBuffer: GPUBuffer | null = null;
                let materialIndexBuffer: GPUBuffer | null = null;
                let scaleBuffer: GPUBuffer | null = null;
                let rotationBuffer: GPUBuffer | null = null;

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvasFormat } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "rotation"], { exclude: ["transparent"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout and pipeline
                    if (!bindGroupLayout) {
                        bindGroupLayout = createBindGroupLayout(device, 2);
                    }

                    if (!pipeline && bindGroupLayout) {
                        pipeline = createRenderPipeline(device, bindGroupLayout, shaderSourceScaleRotation, canvasFormat);
                    }

                    // Initialize and update buffers
                    positionBuffer = getOrCreatePositionBuffer(device, positionBuffer);
                    materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, materialIndexBuffer);
                    scaleBuffer = getOrCreateScaleBuffer(device, scaleBuffer);
                    rotationBuffer = getOrCreateRotationBuffer(device, rotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && scaleBuffer && rotationBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: scaleBuffer } },
                                { binding: 5, resource: { buffer: rotationBuffer } }
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

