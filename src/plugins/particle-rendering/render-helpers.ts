// Helper functions for particle rendering systems

import { SchemaX } from "../../types/index.js";
import { Vec3, Quat } from "@adobe/data/math";

// Schema for particle data structures
const ParticlePositionSchema = Vec3.schema;
const ParticleScaleSchema = Vec3.schema;
const ParticleRotationSchema = Quat.schema;

/**
 * Create a bind group layout for particle rendering
 */
export function createBindGroupLayout(
    device: GPUDevice,
    additionalBindings: number = 0
): GPUBindGroupLayout {
    const entries: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // SceneUniforms
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // Materials
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Positions
        { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Material indices
    ];
    
    for (let i = 0; i < additionalBindings; i++) {
        entries.push({
            binding: 4 + i,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' }
        });
    }
    
    return device.createBindGroupLayout({ entries });
}

/**
 * Create a render pipeline for particle rendering
 */
export function createRenderPipeline(
    device: GPUDevice,
    bindGroupLayout: GPUBindGroupLayout,
    shaderSource: string
): GPURenderPipeline {
    return device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
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
                    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                }
            }]
        },
        primitive: { topology: 'triangle-list', cullMode: 'back' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal', format: 'depth24plus' }
    });
}

/**
 * Get or create a position buffer
 */
export function getOrCreatePositionBuffer(
    device: GPUDevice,
    existingBuffer: GPUBuffer | null
): GPUBuffer {
    if (!existingBuffer) {
        return SchemaX.createStructGPUBuffer(
            ParticlePositionSchema,
            { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
        );
    }
    return existingBuffer;
}

/**
 * Get or create a material index buffer
 */
export function getOrCreateMaterialIndexBuffer(
    device: GPUDevice,
    particleCount: number,
    existingBuffer: GPUBuffer | null
): GPUBuffer {
    if (!existingBuffer) {
        return device.createBuffer({
            size: Math.max(particleCount, 1) * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    }
    return existingBuffer;
}

/**
 * Get or create a scale buffer
 */
export function getOrCreateScaleBuffer(
    device: GPUDevice,
    existingBuffer: GPUBuffer | null
): GPUBuffer {
    if (!existingBuffer) {
        return SchemaX.createStructGPUBuffer(
            ParticleScaleSchema,
            { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
        );
    }
    return existingBuffer;
}

/**
 * Get or create a rotation buffer
 */
export function getOrCreateRotationBuffer(
    device: GPUDevice,
    existingBuffer: GPUBuffer | null
): GPUBuffer {
    if (!existingBuffer) {
        return SchemaX.createStructGPUBuffer(
            ParticleRotationSchema,
            { device, elements: [], usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }
        );
    }
    return existingBuffer;
}
