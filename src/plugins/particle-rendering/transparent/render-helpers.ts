// Render helpers for transparent particle rendering

// Re-export buffer helpers from parent
export {
    getOrCreatePositionBuffer,
    getOrCreateMaterialIndexBuffer,
    getOrCreateScaleBuffer,
    getOrCreateRotationBuffer
} from "../render-helpers.js";

/**
 * Create a bind group layout for transparent particle rendering
 * Includes an additional binding for sorted index buffer (binding 4, 5, etc. depending on variant)
 */
export function createTransparentBindGroupLayout(
    device: GPUDevice,
    additionalBindings: number = 0
): GPUBindGroupLayout {
    // Base bindings: sceneUniforms, materials, positions, materialIndices
    const entries: GPUBindGroupLayoutEntry[] = [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // SceneUniforms
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // Materials
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Positions
        { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Material indices
    ];
    
    // Additional bindings for scale/rotation (binding 4, 5)
    for (let i = 0; i < additionalBindings; i++) {
        entries.push({
            binding: 4 + i,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' }
        });
    }
    
    // Index buffer binding (always last)
    const indexBufferBinding = 4 + additionalBindings;
    entries.push({
        binding: indexBufferBinding,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' } // Sorted indices as u32 array
    });
    
    return device.createBindGroupLayout({ entries });
}

/**
 * Create a render pipeline for transparent particle rendering
 * Same as opaque but with depthWriteEnabled: false
 */
export function createTransparentRenderPipeline(
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
        depthStencil: { 
            depthWriteEnabled: false, // Don't write depth for transparent particles
            depthCompare: 'less-equal', // Still test depth for proper occlusion
            format: 'depth24plus' 
        }
    });
}

/**
 * Create or reuse a GPU buffer for sorted particle indices
 * If the existing buffer is too small, it will be destroyed and a new one created with a growth factor.
 * @returns The buffer (possibly new) and whether it was recreated
 */
export function getOrCreateSortedIndexBuffer(
    device: GPUDevice,
    particleCount: number,
    existingBuffer: GPUBuffer | null
): { buffer: GPUBuffer; wasRecreated: boolean } {
    const requiredSize = Math.max(particleCount, 1) * 4; // u32 = 4 bytes
    
    if (!existingBuffer || existingBuffer.size < requiredSize) {
        if (existingBuffer) {
            existingBuffer.destroy();
        }
        // Use growth factor of 2 to reduce reallocations when particleCount increases
        const growthFactor = 2;
        const newSize = existingBuffer 
            ? Math.max(requiredSize, existingBuffer.size * growthFactor)
            : requiredSize;
        
        return {
            buffer: device.createBuffer({
                size: newSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            }),
            wasRecreated: true
        };
    }
    
    return { buffer: existingBuffer, wasRecreated: false };
}

