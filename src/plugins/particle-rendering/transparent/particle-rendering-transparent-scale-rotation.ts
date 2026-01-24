// Transparent particle rendering plugin for particles with both scale and rotation
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { buildFlatPositionBuffer, sortIndicesByDepth } from "./sort-particles.js";
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
    systems: {
        renderParticlesTransparentScaleRotation: {
            create: (db) => {
                // Closure variables for caching GPU objects across frames
                let bindGroupLayout: GPUBindGroupLayout | null = null;
                let pipeline: GPURenderPipeline | null = null;
                let positionBuffer: GPUBuffer | null = null;
                let materialIndexBuffer: GPUBuffer | null = null;
                let scaleBuffer: GPUBuffer | null = null;
                let rotationBuffer: GPUBuffer | null = null;
                let sortedIndexBuffer: GPUBuffer | null = null;
                // CPU-side buffers for sorting (only grow, never shrink)
                let flatPositions: Float32Array | null = null;
                let sortedIndices: Uint32Array | null = null;
                let depths: Float32Array | null = null;

                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvasFormat, camera } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !camera) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "scale", "rotation", "transparent"]);
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize/grow position buffer (CPU-side, only grows, never shrinks)
                    const requiredPositionSize = particleCount * 3;
                    if (!flatPositions || flatPositions.length < requiredPositionSize) {
                        // Grow buffer to accommodate current particle count
                        flatPositions = new Float32Array(requiredPositionSize);
                    }
                    
                    // Build flat position buffer (reusing existing buffer if large enough)
                    buildFlatPositionBuffer(particleTables, particleCount, flatPositions);
                    
                    // Initialize/grow sorted index buffer (CPU-side, only grows, never shrinks)
                    if (!sortedIndices || sortedIndices.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        sortedIndices = new Uint32Array(particleCount);
                    }
                    
                    // Initialize/grow depth buffer (CPU-side, only grows, never shrinks)
                    if (!depths || depths.length < particleCount) {
                        depths = new Float32Array(particleCount);
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
                    if (!bindGroupLayout) {
                        bindGroupLayout = createTransparentBindGroupLayout(device, 2);
                    }

                    if (!pipeline && bindGroupLayout) {
                        pipeline = createTransparentRenderPipeline(device, bindGroupLayout, shaderSourceScaleRotation, canvasFormat);
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
                    
                    // Create/update sorted index buffer (GPU-side, only grows)
                    const { buffer: newSortedIndexBuffer } = getOrCreateSortedIndexBuffer(device, particleCount, sortedIndexBuffer);
                    device.queue.writeBuffer(newSortedIndexBuffer, 0, indicesView.buffer, indicesView.byteOffset, indicesView.byteLength);
                    sortedIndexBuffer = newSortedIndexBuffer;

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

