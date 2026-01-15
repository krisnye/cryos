// Transparent particle rendering plugin for particles with rotation only
import { Database } from "@adobe/data/ecs";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { particleRenderingTransparentDependencies } from "./dependencies.js";
import { buildFlatPositionBuffer, sortIndicesByDepth } from "./sort-particles.js";
import shaderSourceRotation from './particles-transparent-rotation.wgsl.js';
import {
    createTransparentBindGroupLayout,
    createTransparentRenderPipeline,
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateRotationBuffer,
    getOrCreateSortedIndexBuffer,
} from './render-helpers.js';

export const particleRenderingTransparentRotation = Database.Plugin.create({
    extends: particleRenderingTransparentDependencies,
    resources: {
        transparentRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        transparentRotationPipeline: { default: null as GPURenderPipeline | null },
        transparentRotationPositionBuffer: { default: null as GPUBuffer | null },
        transparentRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        transparentRotationRotationBuffer: { default: null as GPUBuffer | null },
        transparentRotationSortedIndexBuffer: { default: null as GPUBuffer | null },
        transparentRotationSortedIndicesCPU: { default: null as Uint32Array | null }, // CPU-side index buffer (only grows, never shrinks)
        transparentRotationDepthsCPU: { default: null as Float32Array | null }, // CPU-side depth buffer for sorting (only grows, never shrinks)
        transparentRotationPositionsCPU: { default: null as Float32Array | null }, // CPU-side position buffer for sorting (only grows, never shrinks)
    },
    systems: {
        renderParticlesTransparentRotation: {
            create: (db) => {
                return () => {
                    const { device, renderPassEncoder, sceneUniformsBuffer, materialsGpuBuffer, canvas, camera } = db.store.resources;
                    if (!device || !renderPassEncoder || !sceneUniformsBuffer || !materialsGpuBuffer || !canvas || !camera) return;

                    const particleTables = db.store.queryArchetypes(["particle", "position", "material", "rotation", "transparent"], { exclude: ["scale"] });
                    if (particleTables.length === 0) return;

                    const particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
                    if (particleCount === 0) return;

                    // Initialize/grow position buffer (CPU-side, only grows, never shrinks)
                    const requiredPositionSize = particleCount * 3;
                    let flatPositions = db.store.resources.transparentRotationPositionsCPU;
                    if (!flatPositions || flatPositions.length < requiredPositionSize) {
                        // Grow buffer to accommodate current particle count
                        flatPositions = new Float32Array(requiredPositionSize);
                        db.store.resources.transparentRotationPositionsCPU = flatPositions;
                    }
                    
                    // Build flat position buffer (reusing existing buffer if large enough)
                    buildFlatPositionBuffer(particleTables, particleCount, flatPositions);
                    
                    // Initialize/grow sorted index buffer (CPU-side, only grows, never shrinks)
                    let sortedIndices = db.store.resources.transparentRotationSortedIndicesCPU;
                    if (!sortedIndices || sortedIndices.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        sortedIndices = new Uint32Array(particleCount);
                        db.store.resources.transparentRotationSortedIndicesCPU = sortedIndices;
                    }
                    
                    // Initialize/grow depth buffer (CPU-side, only grows, never shrinks)
                    let depths = db.store.resources.transparentRotationDepthsCPU;
                    if (!depths || depths.length < particleCount) {
                        depths = new Float32Array(particleCount);
                        db.store.resources.transparentRotationDepthsCPU = depths;
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
                    let bindGroupLayout = db.store.resources.transparentRotationBindGroupLayout;
                    if (!bindGroupLayout) {
                        bindGroupLayout = db.store.resources.transparentRotationBindGroupLayout = createTransparentBindGroupLayout(device, 1);
                    }

                    let pipeline = db.store.resources.transparentRotationPipeline;
                    if (!pipeline && bindGroupLayout) {
                        pipeline = db.store.resources.transparentRotationPipeline = createTransparentRenderPipeline(device, bindGroupLayout, shaderSourceRotation);
                    }

                    // Initialize and update buffers
                    let positionBuffer = getOrCreatePositionBuffer(device, db.store.resources.transparentRotationPositionBuffer);
                    let materialIndexBuffer = getOrCreateMaterialIndexBuffer(device, particleCount, db.store.resources.transparentRotationMaterialIndexBuffer);
                    let rotationBuffer = getOrCreateRotationBuffer(device, db.store.resources.transparentRotationRotationBuffer);
                    
                    positionBuffer = copyColumnToGPUBuffer(particleTables, "position", device, positionBuffer);
                    materialIndexBuffer = copyColumnToGPUBuffer(particleTables, "material", device, materialIndexBuffer);
                    rotationBuffer = copyColumnToGPUBuffer(particleTables, "rotation", device, rotationBuffer);
                    
                    // Create/update sorted index buffer (GPU-side, only grows)
                    const { buffer: sortedIndexBuffer } = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentRotationSortedIndexBuffer);
                    device.queue.writeBuffer(sortedIndexBuffer, 0, indicesView.buffer, indicesView.byteOffset, indicesView.byteLength);
                    
                    db.store.resources.transparentRotationPositionBuffer = positionBuffer;
                    db.store.resources.transparentRotationMaterialIndexBuffer = materialIndexBuffer;
                    db.store.resources.transparentRotationRotationBuffer = rotationBuffer;
                    db.store.resources.transparentRotationSortedIndexBuffer = sortedIndexBuffer;

                    // Render
                    if (bindGroupLayout && pipeline && positionBuffer && materialIndexBuffer && rotationBuffer && sortedIndexBuffer) {
                        const bindGroup = device.createBindGroup({
                            layout: bindGroupLayout,
                            entries: [
                                { binding: 0, resource: { buffer: sceneUniformsBuffer } },
                                { binding: 1, resource: { buffer: materialsGpuBuffer } },
                                { binding: 2, resource: { buffer: positionBuffer } },
                                { binding: 3, resource: { buffer: materialIndexBuffer } },
                                { binding: 4, resource: { buffer: rotationBuffer } },
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

