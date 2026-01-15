// Particle rendering plugin for particles with scale only
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particle } from "../particle.js";
import { materials } from "../materials.js";
import { scene } from "../scene.js";
import shaderSourceScale from './particles-scale.wgsl.js';
import {
    createBindGroupLayout,
    createRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateScaleBuffer,
} from './render-helpers.js';

export const particleRenderingScale = Database.Plugin.create({
    extends: Database.Plugin.combine(particle, materials, scene),
    resources: {
        scaleBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        scalePipeline: { default: null as GPURenderPipeline | null },
        scalePositionBuffer: { default: null as GPUBuffer | null },
        scaleMaterialIndexBuffer: { default: null as GPUBuffer | null },
        scaleBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticlesScale: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale"], { exclude: ["rotation"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.scaleBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.scaleBindGroupLayout = createBindGroupLayout(device, 1);
                    }

                    let pipeline = db.store.resources.scalePipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.scalePipeline = createRenderPipeline(device, bindGroupLayout, shaderSourceScale);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.scalePositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.scaleMaterialIndexBuffer);
                    let scaleBuffer = getOrCreateScaleBuffer(device, db.store.resources.scaleBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    
                    db.store.resources.scalePositionBuffer = positionBuffer;
                    db.store.resources.scaleMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.scaleBuffer = scaleBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && scaleBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: scaleBuffer } }
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

