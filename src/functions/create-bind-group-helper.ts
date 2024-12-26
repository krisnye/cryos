import { ShaderResourceValues, ShaderUniformValues, ShaderDescriptor, isComputeShaderDescriptor } from "../types/shader-types.js";
import { createUniformHelper } from "./create-uniform-helper.js";
import { toBindGroupLayoutDescriptor } from "./to-bind-group-layout-descriptor.js";
import { Mutable } from "../types/meta-types.js";

export interface BindGroupHelper<S extends ShaderDescriptor> {
    uniforms: Mutable<ShaderUniformValues<S>>;
    resources: Mutable<ShaderResourceValues<S>>;
    maybeWriteToGPU(): void;
    getBindGroup(): GPUBindGroup;
    destroy(): void;
}

export function createBindGroupHelper<S extends ShaderDescriptor>(
    device: GPUDevice,
    descriptor: S,
    initialUniforms: ShaderUniformValues<S>,
    initialResources: ShaderResourceValues<S>
): BindGroupHelper<S> {
    // Create the uniform helper if we have uniforms
    const uniformHelper = descriptor.uniforms 
        ? createUniformHelper(device, descriptor.uniforms, initialUniforms)
        : undefined;

    // Get the bind group layout descriptor
    const layoutDescriptor = toBindGroupLayoutDescriptor(descriptor);
    const layout = device.createBindGroupLayout(layoutDescriptor);

    // Track the current bind group and resource state
    let currentBindGroup: GPUBindGroup | undefined;
    let currentResources = initialResources;
    let isBindGroupDirty = true;

    const result: BindGroupHelper<S> = {
        // Use uniform helper's values directly if it exists
        uniforms: (uniformHelper?.values ?? {}) as Mutable<ShaderUniformValues<S>>,
        resources: undefined as any,

        maybeWriteToGPU: () => {
            uniformHelper?.maybeWriteToGPU();
        },

        getBindGroup: () => {
            // If resources haven't changed and we have a bind group, reuse it
            if (!isBindGroupDirty && currentBindGroup) {
                return currentBindGroup;
            }

            const entries: GPUBindGroupEntry[] = [];
            let bindingIndex = 0;

            // Add uniform buffer if we have one
            if (uniformHelper) {
                entries.push({
                    binding: bindingIndex++,
                    resource: {
                        buffer: uniformHelper.buffer,
                        offset: 0,
                        size: uniformHelper.size
                    }
                });
            }

            if (isComputeShaderDescriptor(descriptor)) {
                // Handle storage buffers for compute shaders
                if (descriptor.storage) {
                    for (const [name, _type] of Object.entries(descriptor.storage)) {
                        const buffer = initialResources[name] as GPUBuffer;
                        if (!buffer) {
                            throw new Error(`Missing storage buffer resource: ${name}`);
                        }
                        entries.push({
                            binding: bindingIndex++,
                            resource: {
                                buffer,
                                offset: 0,
                                size: buffer.size
                            }
                        });
                    }
                }
            } else {
                // Handle graphics shader resources
                // Add textures
                if (descriptor.textures) {
                    for (const [name, _type] of Object.entries(descriptor.textures)) {
                        const texture = initialResources[name] as GPUTexture;
                        if (!texture) {
                            throw new Error(`Missing texture resource: ${name}`);
                        }
                        entries.push({
                            binding: bindingIndex++,
                            resource: texture.createView()
                        });
                    }
                }

                // Add samplers
                if (descriptor.samplers) {
                    for (const [name, _type] of Object.entries(descriptor.samplers)) {
                        const sampler = initialResources[name] as GPUSampler;
                        if (!sampler) {
                            throw new Error(`Missing sampler resource: ${name}`);
                        }
                        entries.push({
                            binding: bindingIndex++,
                            resource: sampler
                        });
                    }
                }

                // Add storage buffers
                if (descriptor.storage) {
                    for (const [name, _type] of Object.entries(descriptor.storage)) {
                        const buffer = initialResources[name] as GPUBuffer;
                        if (!buffer) {
                            throw new Error(`Missing storage buffer resource: ${name}`);
                        }
                        entries.push({
                            binding: bindingIndex++,
                            resource: {
                                buffer,
                                offset: 0,
                                size: buffer.size
                            }
                        });
                    }
                }
            }

            // Create the new bind group
            currentBindGroup = device.createBindGroup({
                layout,
                entries
            });

            isBindGroupDirty = false;
            currentResources = initialResources;

            return currentBindGroup;
        },

        destroy: () => {
            uniformHelper?.destroy();
        }
    };

    // Set up getter/setter for resources to track changes
    Object.defineProperty(result, 'resources', {
        get: () => currentResources,
        set: (newResources: ShaderResourceValues<S>) => {
            if (newResources !== currentResources) {
                isBindGroupDirty = true;
                currentResources = newResources;
            }
        },
        enumerable: true
    });

    return result;
}