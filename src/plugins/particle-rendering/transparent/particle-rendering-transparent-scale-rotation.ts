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
    resources: {
        transparentScaleRotationBindGroupLayout: { default: null as GPUBindGroupLayout | null },
        transparentScaleRotationPipeline: { default: null as GPURenderPipeline | null },
        transparentScaleRotationPositionBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationMaterialIndexBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationScaleBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationRotationBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationSortedIndexBuffer: { default: null as GPUBuffer | null },
        transparentScaleRotationSortedIndicesCPU: { default: null as Uint32Array | null }, // CPU-side index buffer (only grows, never shrinks)
        transparentScaleRotationDepthsCPU: { default: null as Float32Array | null }, // CPU-side depth buffer for sorting (only grows, never shrinks)
        transparentScaleRotationPositionsCPU: { default: null as Float32Array | null }, // CPU-side position buffer for sorting (only grows, never shrinks)
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

                    // Initialize/grow position buffer (CPU-side, only grows, never shrinks)
                    const requiredPositionSize = particleCount * 3;
                    let flatPositions = db.store.resources.transparentScaleRotationPositionsCPU;
                    if (!flatPositions || flatPositions.length < requiredPositionSize) {
                        // Grow buffer to accommodate current particle count
                        flatPositions = new Float32Array(requiredPositionSize);
                        db.store.resources.transparentScaleRotationPositionsCPU = flatPositions;
                    }
                    
                    // Build flat position buffer (reusing existing buffer if large enough)
                    buildFlatPositionBuffer(particleTables, particleCount, flatPositions);
                    
                    // Initialize/grow sorted index buffer (CPU-side, only grows, never shrinks)
                    let sortedIndices = db.store.resources.transparentScaleRotationSortedIndicesCPU;
                    if (!sortedIndices || sortedIndices.length < particleCount) {
                        // Grow buffer to accommodate current particle count
                        sortedIndices = new Uint32Array(particleCount);
                        db.store.resources.transparentScaleRotationSortedIndicesCPU = sortedIndices;
                    }
                    
                    // Initialize/grow depth buffer (CPU-side, only grows, never shrinks)
                    let depths = db.store.resources.transparentScaleRotationDepthsCPU;
                    if (!depths || depths.length < particleCount) {
                        depths = new Float32Array(particleCount);
                        db.store.resources.transparentScaleRotationDepthsCPU = depths;
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
                    
                    // Create/update sorted index buffer (GPU-side, only grows)
                    let sortedIndexBuffer = getOrCreateSortedIndexBuffer(device, particleCount, db.store.resources.transparentScaleRotationSortedIndexBuffer);
                    const sortedIndicesSubarray = indicesView;
                    if (sortedIndexBuffer.size < sortedIndicesSubarray.byteLength) {
                        sortedIndexBuffer.destroy();
                        sortedIndexBuffer = device.createBuffer({
                            size: sortedIndicesSubarray.byteLength,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                        });
                    }
                    device.queue.writeBuffer(sortedIndexBuffer, 0, sortedIndicesSubarray.buffer, sortedIndicesSubarray.byteOffset, sortedIndicesSubarray.byteLength);
                    
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

