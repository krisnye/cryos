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
    resources: {
        scaleRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        scaleRotationPipeline: { default: null as GPURenderPipeline | null },
        scaleRotationPositionBuffer: { default: null as GPUBuffer | null },
        scaleRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        scaleRotationScaleBuffer: { default: null as GPUBuffer | null },
        scaleRotationRotationBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticlesScaleRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "rotation"], { exclude: ["transparent"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.scaleRotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.scaleRotationBindGroupLayout = createBindGroupLayout(device, 2);
                    }

                    let pipeline = db.store.resources.scaleRotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.scaleRotationPipeline = createRenderPipeline(device, bindGroupLayout, shaderSourceScaleRotation);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.scaleRotationPositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.scaleRotationMaterialIndexBuffer);
                    let scaleBuffer = getOrCreateScaleBuffer(device, db.store.resources.scaleRotationScaleBuffer);
                    let rotationBuffer = getOrCreateRotationBuffer(device, db.store.resources.scaleRotationRotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    
                    db.store.resources.scaleRotationPositionBuffer = positionBuffer;
                    db.store.resources.scaleRotationMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.scaleRotationScaleBuffer = scaleBuffer;
                    db.store.resources.scaleRotationRotationBuffer = rotationBuffer;

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

