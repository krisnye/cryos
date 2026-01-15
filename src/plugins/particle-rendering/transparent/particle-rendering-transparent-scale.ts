// Transparent particle rendering plugin for particles with scale only
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { buildFlatPositionBuffer, sortIndicesByDepth } from "./sort-particles.js";
import shaderSourceScale from './particles-transparent-scale.wgsl.js';
import {
    createTransparentBindGroupLayout,
    createTransparentRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateScaleBuffer,
    getOrCreateSortedIndexBuffer,
} from './render-helpers.js';

export const particleRenderingTransparentScale = Database.Plugin.create({
    extends: particleRenderingTransparentDependencies,
    resources: {
        transparentScaleBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        transparentScalePipeline: { default: null as GPURenderPipeline | null },
        transparentScalePositionBuffer: { default: null as GPUBuffer | null },
        transparentScaleMaterialIndexBuffer: { default: null as GPUBuffer | null },
        transparentScaleScaleBuffer: { default: null as GPUBuffer | null },
        transparentScaleSortedIndexBuffer: { default: null as GPUBuffer | null },
        transparentScaleSortedIndicesCPU: { default: null as Uint32Array | null }, // CPU-side index buffer (only grows, never shrinks)
        transparentScaleDepthsCPU: { default: null as Float32Array | null }, // CPU-side depth buffer for sorting (only grows, never shrinks)
        transparentScalePositionsCPU: { default: null as Float32Array | null }, // CPU-side position buffer for sorting (only grows, never shrinks)
    },
    systems: {
        renderParticlesTransparentScale: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas, camera } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas || !camera) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "transparent"], { exclude: ["rotation"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize/grow position buffer (CPU-side, only grows, never shrinks)
                    const requiredPositionSize = particleCount * 3;
                    let flatPositions = db.store.resources.transparentScalePositionsCPU;
                    if (!flatPositions || flatPositions.length < requiredPositionSize) {
                        // Grow buffer to accommodate current particle count
                        flatPositions = new Float32Array(requiredPositionSize);
                        db.store.resources.transparentScalePositionsCPU = flatPositions;
                    }
                    
                    // Build flat position buffer (reusing existing buffer if large enough)
                    buildFlatPositionBuffer(particleTables, particleCount, flatPositions);
                    
                    // Initialize/grow sorted index buffer (CPU-side, only grows, never shrinks)
                    let sortedIndices = db.store.resources.transparentScaleSortedIndicesCPU;
                    if (!sortedIndices || sortedIndices.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        sortedIndices = new Uint32Array(particleCount);
                        db.store.resources.transparentScaleSortedIndicesCPU = sortedIndices;
                    }
                    
                    // Initialize/grow depth buffer (CPU-side, only grows, never shrinks)
                    let depths = db.store.resources.transparentScaleDepthsCPU;
                    if (!depths || depths.length < particleCount) {
                        depths = new Float32Array(particleCount);
                        db.store.resources.transparentScaleDepthsCPU = depths;
                    }
                    
                    // Reset indices to [0, 1, 2, ..., count-1] for current particle count
                    // (even if buffer is larger, we only reset up to particleCount)
                    const indicesView = sortedIndices.subarray(0, particleCount);
                    for (let i = 0; i < particleCount; i++) {
                        indicesView[i] = i;
                    }
                    
                    // Sort indices by depth (furthest first, back-to-front)
                    sortIndicesByDepth(flatPositions, indicesView, camera.position, depths);

                    // Initialize bind group layout and pipeline
                    let bindGroupLayout = db.store.resources.transparentScaleBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.transparentScaleBindGroupLayout = createTransparentBindGroupLayout(device, 1);
                    }

                    let pipeline = db.store.resources.transparentScalePipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.transparentScalePipeline = createTransparentRenderPipeline(device, bindGroupLayout, shaderSourceScale);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.transparentScalePositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.transparentScaleMaterialIndexBuffer);
                    let scaleBuffer = getOrCreateScaleBuffer(device, db.store.resources.transparentScaleScaleBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    scaleBuffer = copyColumnToGPUBuffer(particleTables, "scale", device, scaleBuffer);
                    
                    // Create/update sorted index buffer (GPU-side, only grows)
                    let sortedIndexBuffer = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentScaleSortedIndexBuffer);
                    const sortedIndicesSubarray = indicesView;
                    if (sortedIndexBuffer.size < sortedIndicesSubarray.byteLength) {
                        sortedIndexBuffer.destroy();
                        sortedIndexBuffer = device.createBuffer({
                            size: sortedIndicesSubarray.byteLength,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }
                    device.queue.writeBuffer(sortedIndexBuffer, 0, sortedIndicesSubarray.buffer, sortedIndicesSubarray.byteOffset, sortedIndicesSubarray.byteLength);
                    
                    db.store.resources.transparentScalePositionBuffer = positionBuffer;
                    db.store.resources.transparentScaleMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.transparentScaleScaleBuffer = scaleBuffer;
                    db.store.resources.transparentScaleSortedIndexBuffer = sortedIndexBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && scaleBuffer && sortedIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: scaleBuffer } },
                                { binding: 5, resource: { buffer: sortedIndexBuffer } } // Index buffer
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

