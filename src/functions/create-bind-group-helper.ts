import { UniformValues } from "../internal/core/types.js";
import { GraphicShaderDescriptor, ShaderResourceValues, ShaderUniformValues } from "../types/shader-types.js";
import { createUniformHelper } from "./create-uniform-helper.js";
import { toBindGroupLayoutDescriptor } from "./to-bind-group-layout-descriptor.js";

interface BindGroupHelper<G extends GraphicShaderDescriptor> {
    uniforms: ShaderUniformValues<G>;
    resources: ShaderResourceValues<G>;

    maybeWriteToGPU(): void;
    getBindGroup(): GPUBindGroup;
}

export function createBindGroupHelper<G extends GraphicShaderDescriptor>(
    device: GPUDevice,
    descriptor: G,
    uniforms: ShaderUniformValues<G>,
    resources: ShaderResourceValues<G>
): BindGroupHelper<G> {
    // Create the uniform helper if we have uniforms
    const uniformHelper = descriptor.uniforms 
        ? createUniformHelper(device, descriptor.uniforms, uniforms)
        : undefined;

    // Get the bind group layout descriptor
    const layoutDescriptor = toBindGroupLayoutDescriptor(descriptor);
    const layout = device.createBindGroupLayout(layoutDescriptor);

    // Track the current bind group and resource state
    let currentBindGroup: GPUBindGroup | undefined;
    let lastResourceState = JSON.stringify(resources);

    const result: BindGroupHelper<G> = {
        uniforms,
        resources,

        maybeWriteToGPU: () => {
            // Update uniforms if needed
            uniformHelper?.maybeWriteToGPU();
        },

        getBindGroup: () => {
            const currentResourceState = JSON.stringify(resources);
            
            // If resources haven't changed and we have a bind group, reuse it
            if (currentBindGroup && currentResourceState === lastResourceState) {
                return currentBindGroup;
            }

            // Resources changed, need to create new bind group
            lastResourceState = currentResourceState;

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

            // Add textures
            if (descriptor.textures) {
                for (const [name, _type] of Object.entries(descriptor.textures)) {
                    const texture = resources[name] as GPUTexture;
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
                    const sampler = resources[name] as GPUSampler;
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
                    const buffer = resources[name] as GPUBuffer;
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

            // Create the new bind group
            currentBindGroup = device.createBindGroup({
                layout,
                entries
            });

            return currentBindGroup;
        }
    };

    // Set up getters/setters for uniforms to proxy through to the uniform helper
    if (uniformHelper && descriptor.uniforms) {
        for (const [prop, _type] of Object.entries(descriptor.uniforms)) {
            Object.defineProperty(result.uniforms, prop, {
                get: () => uniformHelper[prop],
                set: (value: any) => {
                    uniformHelper[prop] = value;
                },
                enumerable: true
            });
        }
    }

    return result;
}