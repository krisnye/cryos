// Transparent particle rendering plugin for base particles (no scale/rotation)
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { sortParticlesByDepth } from "./sort-particles.js";
import shaderSourceBase from './particles-transparent-base.wgsl.js';
import {
    createTransparentBindGroupLayout,
    createTransparentRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateSortedIndexBuffer,
} from './render-helpers.js';

export const particleRenderingTransparentBase = Database.Plugin.create({
    extends: particleRenderingTransparentDependencies,
    resources: {
        transparentBaseBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        transparentBasePipeline: { default: null as GPURenderPipeline | null },
        transparentBasePositionBuffer: { default: null as GPUBuffer | null },
        transparentBaseMaterialIndexBuffer: { default: null as GPUBuffer | null },
        transparentBaseSortedIndexBuffer: { default: null as GPUBuffer | null },
    },
    systems: {
        renderParticlesTransparentBase: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas, camera } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas || !camera) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "transparent"], { exclude: ["scale", "rotation"] });
                    if (particleTables.length === 0) {
                        return;
                    }

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) {
                        return;
                    }
                    
                    // Sort particles by depth (furthest first, back-to-front)
                    const sortedRefs = sortParticlesByDepth(particleTables, camera.position);
                    
                    // Build flat index mapping: for each table/row, calculate its flat index in the concatenated buffer
                    // Tables are concatenated sequentially, so we need to accumulate offsets
                    const tableRowCounts: number[] = [];
                    let flatIndexOffset = 0;
                    for (let i = 0; i < particleTables.length; i++) {
                        tableRowCounts.push(flatIndexOffset);
                        flatIndexOffset += particleTables[i].rowCount;
                    }
                    
                    // Build sorted index array: sortedRefs map to original flat indices
                    const sortedIndices = new Uint32Array(particleCount);
                    for (let i = 0; i < sortedRefs.length; i++) {
                        const { tableIndex, rowIndex } = sortedRefs[i];
                        sortedIndices[i] = tableRowCounts[tableIndex] + rowIndex;
                    }

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.transparentBaseBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.transparentBaseBindGroupLayout = createTransparentBindGroupLayout(device, 0);
                    }

                    let pipeline = db.store.resources.transparentBasePipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.transparentBasePipeline = createTransparentRenderPipeline(device, bindGroupLayout, shaderSourceBase);
                    }

                    // Initialize and update buffers (copy data in original order - shader uses indirect indexing)
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.transparentBasePositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.transparentBaseMaterialIndexBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    
                    // Create/update sorted index buffer
                    let sortedIndexBuffer = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentBaseSortedIndexBuffer);
                    if (sortedIndexBuffer.size < sortedIndices.byteLength) {
                        sortedIndexBuffer.destroy();
                        sortedIndexBuffer = device.createBuffer({
                            size: sortedIndices.byteLength,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }
                    device.queue.writeBuffer(sortedIndexBuffer, 0, sortedIndices);
                    
                    db.store.resources.transparentBasePositionBuffer = positionBuffer;
                    db.store.resources.transparentBaseMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.transparentBaseSortedIndexBuffer = sortedIndexBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && sortedIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: sortedIndexBuffer } } // Index buffer
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

