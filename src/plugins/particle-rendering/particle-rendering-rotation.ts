// Particle rendering plugin for particles with rotation only
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particle } from "../particle.js";
import { materials } from "../materials.js";
import { scene } from "../scene.js";
import shaderSourceRotation from './particles-rotation.wgsl.js';
import {
    createBindGroupLayout,
    createRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateRotationBuffer,
} from './render-helpers.js';

export const particleRenderingRotation = Database.Plugin.create({
    extends: Database.Plugin.combine(particle, materials, scene),
    resources: {
        rotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        rotationPipeline: { default: null as GPURenderPipeline | null },
        rotationPositionBuffer: { default: null as GPUBuffer | null },
        rotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        rotationBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticlesRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "rotation"], { exclude: ["scale"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.rotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.rotationBindGroupLayout = createBindGroupLayout(device, 1);
                    }

                    let pipeline = db.store.resources.rotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.rotationPipeline = createRenderPipeline(device, bindGroupLayout, shaderSourceRotation);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.rotationPositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.rotationMaterialIndexBuffer);
                    let rotationBuffer = getOrCreateRotationBuffer(device, db.store.resources.rotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    
                    db.store.resources.rotationPositionBuffer = positionBuffer;
                    db.store.resources.rotationMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.rotationBuffer = rotationBuffer;

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

