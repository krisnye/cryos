import { Database } from "@adobe/data/ecs";
import { Vec3, Quat } from "@adobe/data/math";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particle } from "../particle.js";
import { materials } from "../materials.js";
import { scene } from "../scene.js";
import { SchemaX } from "../../types/index.js";
import shaderSourceBase from './particles-base.wgsl.js';
import shaderSourceScale from './particles-scale.wgsl.js';
import shaderSourceRotation from './particles-rotation.wgsl.js';
import shaderSourceScaleRotation from './particles-scale-rotation.wgsl.js';

// Schema for particle data structures
const ParticlePositionSchema = Vec3.schema;
const ParticleScaleSchema = Vec3.schema;
const ParticleRotationSchema = Quat.schema;

export const particleRendering = Database.Plugin.create({
    resources: {
        // GPU rendering resources for base particles (no scale/rotation)
        particleBaseBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        particleBasePipeline: { default: null as GPURenderPipeline | null },
        particleBasePositionBuffer: { default: null as GPUBuffer | null },
        particleBaseMaterialIndexBuffer: { default: null as GPUBuffer | null },
        
        // GPU rendering resources for scale-only particles
        particleScaleBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        particleScalePipeline: { default: null as GPURenderPipeline | null },
        particleScalePositionBuffer: { default: null as GPUBuffer | null },
        particleScaleMaterialIndexBuffer: { default: null as GPUBuffer | null },
        particleScaleBuffer: { default: null as GPUBuffer | null },
        
        // GPU rendering resources for rotation-only particles
        particleRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        particleRotationPipeline: { default: null as GPURenderPipeline | null },
        particleRotationPositionBuffer: { default: null as GPUBuffer | null },
        particleRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        particleRotationBuffer: { default: null as GPUBuffer | null },
        
        // GPU rendering resources for scale+rotation particles
        particleScaleRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        particleScaleRotationPipeline: { default: null as GPURenderPipeline | null },
        particleScaleRotationPositionBuffer: { default: null as GPUBuffer | null },
        particleScaleRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        particleScaleRotationScaleBuffer: { default: null as GPUBuffer | null },
        particleScaleRotationRotationBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        // Render base particles (no scale/rotation)
        renderParticlesBase: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query for particles without scale or rotation
                    const particleTables = db.store.queryArchetypes(["particle", "position", "material"], { exclude: ["scale", "rotation"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout
                    let bindGroupLayout = db.store.resources.particleBaseBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.particleBaseBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                            ]
                        });
                    }

                    // Initialize pipeline
                    let pipeline = db.store.resources.particleBasePipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.particleBasePipeline = device.createRenderPipeline({
                            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
                            vertex: {
                                module: device.createShaderModule({ code: shaderSourceBase }),
                                entryPoint: 'vertexMain'
                            },
                            fragment: {
                                module: device.createShaderModule({ code: shaderSourceBase }),
                                entryPoint: 'fragmentMain',
                                targets: [{
                                    format: navigator.gpu.getPreferredCanvasFormat(),
                                    blend: {
                                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                                    }
                                }]
                            },
                            primitive: { topology: 'triangle-list', cullMode: 'back' },
                            depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal', format: 'depth24plus' }
                        });
                    }

                    // Initialize and update buffers
                    let positionBuffer = db.store.resources.particleBasePositionBuffer;
                    if (!positionBuffer) {
                        positionBuffer = db.store.resources.particleBasePositionBuffer = SchemaX.createStructGPUBuffer(
                            ParticlePositionSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    let materialIndexBuffer = db.store.resources.particleBaseMaterialIndexBuffer;
                    if (!materialIndexBuffer) {
                        materialIndexBuffer = db.store.resources.particleBaseMaterialIndexBuffer = device.createBuffer({
                            size: Math.max(particleCount, 1) * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    db.store.resources.particleBasePositionBuffer = positionBuffer;

                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    db.store.resources.particleBaseMaterialIndexBuffer = materialIndexBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } }
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

        // Render scale-only particles
        renderParticlesScale: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query for particles with scale but no rotation
                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale"], { exclude: ["rotation"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout
                    let bindGroupLayout = db.store.resources.particleScaleBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.particleScaleBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 4, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                            ]
                        });
                    }

                    // Initialize pipeline
                    let pipeline = db.store.resources.particleScalePipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.particleScalePipeline = device.createRenderPipeline({
                            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
                            vertex: {
                                module: device.createShaderModule({ code: shaderSourceScale }),
                                entryPoint: 'vertexMain'
                            },
                            fragment: {
                                module: device.createShaderModule({ code: shaderSourceScale }),
                                entryPoint: 'fragmentMain',
                                targets: [{
                                    format: navigator.gpu.getPreferredCanvasFormat(),
                                    blend: {
                                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                                    }
                                }]
                            },
                            primitive: { topology: 'triangle-list', cullMode: 'back' },
                            depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal', format: 'depth24plus' }
                        });
                    }

                    // Initialize and update buffers
                    let positionBuffer = db.store.resources.particleScalePositionBuffer;
                    if (!positionBuffer) {
                        positionBuffer = db.store.resources.particleScalePositionBuffer = SchemaX.createStructGPUBuffer(
                            ParticlePositionSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    let materialIndexBuffer = db.store.resources.particleScaleMaterialIndexBuffer;
                    if (!materialIndexBuffer) {
                        materialIndexBuffer = db.store.resources.particleScaleMaterialIndexBuffer = device.createBuffer({
                            size: Math.max(particleCount, 1) * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let scaleBuffer = db.store.resources.particleScaleBuffer;
                    if (!scaleBuffer) {
                        scaleBuffer = db.store.resources.particleScaleBuffer = SchemaX.createStructGPUBuffer(
                            ParticleScaleSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    db.store.resources.particleScalePositionBuffer = positionBuffer;

                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    db.store.resources.particleScaleMaterialIndexBuffer = materialIndexBuffer;

                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    db.store.resources.particleScaleBuffer = scaleBuffer;

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

        // Render rotation-only particles
        renderParticlesRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query for particles with rotation but no scale
                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "rotation"], { exclude: ["scale"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout
                    let bindGroupLayout = db.store.resources.particleRotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.particleRotationBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 4, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                            ]
                        });
                    }

                    // Initialize pipeline
                    let pipeline = db.store.resources.particleRotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.particleRotationPipeline = device.createRenderPipeline({
                            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
                            vertex: {
                                module: device.createShaderModule({ code: shaderSourceRotation }),
                                entryPoint: 'vertexMain'
                            },
                            fragment: {
                                module: device.createShaderModule({ code: shaderSourceRotation }),
                                entryPoint: 'fragmentMain',
                                targets: [{
                                    format: navigator.gpu.getPreferredCanvasFormat(),
                                    blend: {
                                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                                    }
                                }]
                            },
                            primitive: { topology: 'triangle-list', cullMode: 'back' },
                            depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal', format: 'depth24plus' }
                        });
                    }

                    // Initialize and update buffers
                    let positionBuffer = db.store.resources.particleRotationPositionBuffer;
                    if (!positionBuffer) {
                        positionBuffer = db.store.resources.particleRotationPositionBuffer = SchemaX.createStructGPUBuffer(
                            ParticlePositionSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    let materialIndexBuffer = db.store.resources.particleRotationMaterialIndexBuffer;
                    if (!materialIndexBuffer) {
                        materialIndexBuffer = db.store.resources.particleRotationMaterialIndexBuffer = device.createBuffer({
                            size: Math.max(particleCount, 1) * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let rotationBuffer = db.store.resources.particleRotationBuffer;
                    if (!rotationBuffer) {
                        rotationBuffer = db.store.resources.particleRotationBuffer = SchemaX.createStructGPUBuffer(
                            ParticleRotationSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    db.store.resources.particleRotationPositionBuffer = positionBuffer;

                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    db.store.resources.particleRotationMaterialIndexBuffer = materialIndexBuffer;

                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    db.store.resources.particleRotationBuffer = rotationBuffer;

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

        // Render scale+rotation particles
        renderParticlesScaleRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer) return;

                    // Query for particles with both scale and rotation
                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "rotation"]);
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize bind group layout
                    let bindGroupLayout = db.store.resources.particleScaleRotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.particleScaleRotationBindGroupLayout = device.createBindGroupLayout({
                            entries: [
                                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 4, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                                { binding: 5, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                            ]
                        });
                    }

                    // Initialize pipeline
                    let pipeline = db.store.resources.particleScaleRotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        const canvas = db.store.resources.canvas;
                        if (!canvas) return;

                        pipeline = db.store.resources.particleScaleRotationPipeline = device.createRenderPipeline({
                            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
                            vertex: {
                                module: device.createShaderModule({ code: shaderSourceScaleRotation }),
                                entryPoint: 'vertexMain'
                            },
                            fragment: {
                                module: device.createShaderModule({ code: shaderSourceScaleRotation }),
                                entryPoint: 'fragmentMain',
                                targets: [{
                                    format: navigator.gpu.getPreferredCanvasFormat(),
                                    blend: {
                                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                                    }
                                }]
                            },
                            primitive: { topology: 'triangle-list', cullMode: 'back' },
                            depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal', format: 'depth24plus' }
                        });
                    }

                    // Initialize and update buffers
                    let positionBuffer = db.store.resources.particleScaleRotationPositionBuffer;
                    if (!positionBuffer) {
                        positionBuffer = db.store.resources.particleScaleRotationPositionBuffer = SchemaX.createStructGPUBuffer(
                            ParticlePositionSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    let materialIndexBuffer = db.store.resources.particleScaleRotationMaterialIndexBuffer;
                    if (!materialIndexBuffer) {
                        materialIndexBuffer = db.store.resources.particleScaleRotationMaterialIndexBuffer = device.createBuffer({
                            size: Math.max(particleCount, 1) * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }

                    let scaleBuffer = db.store.resources.particleScaleRotationScaleBuffer;
                    if (!scaleBuffer) {
                        scaleBuffer = db.store.resources.particleScaleRotationScaleBuffer = SchemaX.createStructGPUBuffer(
                            ParticleScaleSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    let rotationBuffer = db.store.resources.particleScaleRotationRotationBuffer;
                    if (!rotationBuffer) {
                        rotationBuffer = db.store.resources.particleScaleRotationRotationBuffer = SchemaX.createStructGPUBuffer(
                            ParticleRotationSchema, { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
                        );
                    }

                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    db.store.resources.particleScaleRotationPositionBuffer = positionBuffer;

                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    db.store.resources.particleScaleRotationMaterialIndexBuffer = materialIndexBuffer;

                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    db.store.resources.particleScaleRotationScaleBuffer = scaleBuffer;

                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    db.store.resources.particleScaleRotationRotationBuffer = rotationBuffer;

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
    extends: Database.Plugin.combine(particle, materials, scene)
});
