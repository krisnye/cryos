// Transparent particle rendering plugin for base particles (no scale/rotation)
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { buildFlatPositionBuffer, sortIndicesByDepth } from "./sort-particles.js";
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
        transparentBaseSortedIndicesCPU: { default: null as Uint32Array | null }, // CPU-side index buffer (only grows, never shrinks)
        transparentBaseDepthsCPU: { default: null as Float32Array | null }, // CPU-side depth buffer for sorting (only grows, never shrinks)
        transparentBasePositionsCPU: { default: null as Float32Array | null }, // CPU-side position buffer for sorting (only grows, never shrinks)
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
                    
                    // Initialize/grow position buffer (CPU-side, only grows, never shrinks)
                    const requiredPositionSize = particleCount * 3;
                    let flatPositions = db.store.resources.transparentBasePositionsCPU;
                    if (!flatPositions || flatPositions.length < requiredPositionSize) {
                        // Grow buffer to accommodate current particle count
                        flatPositions = new Float32Array(requiredPositionSize);
                        db.store.resources.transparentBasePositionsCPU = flatPositions;
                    }
                    
                    // Build flat position buffer (reusing existing buffer if large enough)
                    buildFlatPositionBuffer(particleTables, particleCount, flatPositions);
                    
                    // Initialize/grow sorted index buffer (CPU-side, only grows, never shrinks)
                    let sortedIndices = db.store.resources.transparentBaseSortedIndicesCPU;
                    if (!sortedIndices || sortedIndices.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        sortedIndices = new Uint32Array(particleCount);
                        db.store.resources.transparentBaseSortedIndicesCPU = sortedIndices;
                    }
                    
                    // Initialize/grow depth buffer (CPU-side, only grows, never shrinks)
                    // Depth buffer is indexed by particle index (0..particleCount-1), so needs to be at least particleCount
                    let depths = db.store.resources.transparentBaseDepthsCPU;
                    if (!depths || depths.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        depths = new Float32Array(particleCount);
                        db.store.resources.transparentBaseDepthsCPU = depths;
                    }
                    
                    // Reset indices to [0, 1, 2, ..., count-1] for current particle count
                    // (even if buffer is larger, we only reset up to particleCount)
                    const indicesView = sortedIndices.subarray(0, particleCount);
                    for (let i = 0; i < particleCount; i++) {
                        indicesView[i] = i;
                    }
                    
                    // Sort indices by depth (furthest first, back-to-front)
                    // Uses pre-computed depth buffer for efficiency (depths indexed by particle index)
                    sortIndicesByDepth(flatPositions, indicesView, camera.position, depths);

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
                    
                    // Create/update sorted index buffer (GPU-side, only grows)
                    const { buffer: sortedIndexBuffer } = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentBaseSortedIndexBuffer);
                    device.queue.writeBuffer(sortedIndexBuffer, 0, indicesView.buffer, indicesView.byteOffset, indicesView.byteLength);
                    
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

