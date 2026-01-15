// Transparent particle rendering plugin for particles with both scale and rotation
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { sortParticlesByDepth } from "./sort-particles.js";
import shaderSourceScaleRotation from './particles-transparent-scale-rotation.wgsl.js';
import {
    createTransparentBindGroupLayout,
    createTransparentRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateScaleBuffer,
    getOrCreateRotationBuffer,
    getOrCreateSortedIndexBuffer,
} from './render-helpers.js';

export const particleRenderingTransparentScaleRotation = Database.Plugin.create({
    extends: particleRenderingTransparentDependencies,
    resources: {
        transparentScaleRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        transparentScaleRotationPipeline: { default: null as GPURenderPipeline | null },
        transparentScaleRotationPositionBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationScaleBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationRotationBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationSortedIndexBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticlesTransparentScaleRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas, camera } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas || !camera) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "rotation", "transparent"]);
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Sort particles by depth (furthest first, back-to-front)
                    const sortedRefs = sortParticlesByDepth(particleTables, camera.position);
                    
                    // Build flat index mapping
                    const tableRowCounts: number[] = [];
                    let flatIndexOffset = 0;
                    for (let i = 0; i < particleTables.length; i++) {
                        tableRowCounts.push(flatIndexOffset);
                        flatIndexOffset += particleTables[i].rowCount;
                    }
                    
                    // Build sorted index array
                    const sortedIndices = new Uint32Array(particleCount);
                    for (let i = 0; i < sortedRefs.length; i++) {
                        const { tableIndex, rowIndex } = sortedRefs[i];
                        sortedIndices[i] = tableRowCounts[tableIndex] + rowIndex;
                    }

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.transparentScaleRotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.transparentScaleRotationBindGroupLayout = createTransparentBindGroupLayout(device, 2);
                    }

                    let pipeline = db.store.resources.transparentScaleRotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.transparentScaleRotationPipeline = createTransparentRenderPipeline(device, bindGroupLayout, shaderSourceScaleRotation);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.transparentScaleRotationPositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.transparentScaleRotationMaterialIndexBuffer);
                    let scaleBuffer = getOrCreateScaleBuffer(device, db.store.resources.transparentScaleRotationScaleBuffer);
                    let rotationBuffer = getOrCreateRotationBuffer(device, db.store.resources.transparentScaleRotationRotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    
                    // Create/update sorted index buffer
                    let sortedIndexBuffer = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentScaleRotationSortedIndexBuffer);
                    if (sortedIndexBuffer.size < sortedIndices.byteLength) {
                        sortedIndexBuffer.destroy();
                        sortedIndexBuffer = device.createBuffer({
                            size: sortedIndices.byteLength,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }
                    device.queue.writeBuffer(sortedIndexBuffer, 0, sortedIndices);
                    
                    db.store.resources.transparentScaleRotationPositionBuffer = positionBuffer;
                    db.store.resources.transparentScaleRotationMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.transparentScaleRotationScaleBuffer = scaleBuffer;
                    db.store.resources.transparentScaleRotationRotationBuffer = rotationBuffer;
                    db.store.resources.transparentScaleRotationSortedIndexBuffer = sortedIndexBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && scaleBuffer && rotationBuffer && sortedIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: scaleBuffer } },
                                { binding: 5, resource: { buffer: rotationBuffer } },
                                { binding: 6, resource: { buffer: sortedIndexBuffer } } // Index buffer
                            ]
                        });

                        renderPassEncoder.setPipeline(pipeline);
                        renderPassEncoder.setBindGroup(0, bindGroup);
                        renderPassEncoder.draw(36, particleCount, 0, 0);
                    }
                };
            },
            schedule: { 
                during: ["render"]
                // Note: This will run after opaque systems due to plugin combination order
            }
        },
    },
});

