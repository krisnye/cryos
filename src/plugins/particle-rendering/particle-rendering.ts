import { Database } from "@adobe/data/ecs";
import { Vec3, I32 } from "@adobe/data/math";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particle } from "../particle.js";
import { materials } from "../materials.js";
import { scene } from "../scene.js";
import { SchemaX } from "../../types/index.js";
import shaderSource from './particles.wgsl.js';

// Schema for particle data structures
const ParticlePositionSchema = Vec3.schema;

export const particleRendering = Database.Plugin.create({
    resources: {
        // GPU rendering resources (lazy initialized)
        particleBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        particlePipeline: { default: null as GPURenderPipeline | null },
        particlePositionBuffer: { default: null as GPUBuffer | null },
        particleMaterialIndexBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticles: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Initialize bind group layout if needed
                    let bindGroupLayout = db.store.resources.particleBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.particleBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                {
                                    binding: 0,
                                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                                    buffer: { type: 'uniform' }
                                },
                                {
                                    binding: 1,
                                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
                            ]
                        });
                    }

                    // Initialize pipeline if needed
                    let pipeline = db.store.resources.particlePipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.particlePipeline = device.createRenderPipeline({
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

                    // Query for particle entities using the Particle archetype components
                    const particleTables = db.store.queryArchetypes(["particle", "position", "material"]);
                    if (particleTables.length === 0) {
                        return;
                    }

                    // Calculate total particle count
                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize buffers if needed
                    let particlePositionBuffer = db.store.resources.particlePositionBuffer;
                    if (!particlePositionBuffer) {
                        particlePositionBuffer = db.store.resources.particlePositionBuffer = SchemaX.createStructGPUBuffer(
                            ParticlePositionSchema, {
                            device,
                            elements: [],
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let particleMaterialIndexBuffer = db.store.resources.particleMaterialIndexBuffer;
                    if (!particleMaterialIndexBuffer) {
                        particleMaterialIndexBuffer = db.store.resources.particleMaterialIndexBuffer = device.createBuffer({
                            size: Math.max(particleCount, 1) * 4, // u32/i32 is 4 bytes
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    // Update GPU buffers using efficient column copying (automatically resizes as needed)
                    particlePositionBuffer = copyColumnToGPUBuffer(
                        particleTables,
                        "position",
                        device,
                        particlePositionBuffer
                    );
                    db.store.resources.particlePositionBuffer = particlePositionBuffer;

                    particleMaterialIndexBuffer = copyColumnToGPUBuffer(
                        particleTables,
                        "material",
                        device,
                        particleMaterialIndexBuffer
                    );
                    db.store.resources.particleMaterialIndexBuffer = particleMaterialIndexBuffer;

                    // Create bind group and render (must be created after buffer updates in case buffers were resized)
                    if (bindGroupLayout && pipeline && particlePositionBuffer && particleMaterialIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: particlePositionBuffer } },
                                { binding: 3, resource: { buffer: particleMaterialIndexBuffer } }
                            ]
                        });

                        renderPassEncoder.setPipeline(pipeline);
                        renderPassEncoder.setBindGroup(0, bindGroup);
                        renderPassEncoder.draw(36, particleCount, 0, 0); // 36 vertices per cube, particleCount instances
                    }
                };
            },
            schedule: { during: ["render"] }
        }
    },
    extends: Database.Plugin.combine(particle, materials, scene)
});

