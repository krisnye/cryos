import { ResourceType } from "../types/resource-types.js";
import { ShaderDescriptor, isComputeShaderDescriptor, isGraphicShaderDescriptor } from "../types/shader-types.js";
import { toWGSLType } from "./to-wgsl-type.js";
import { parseComputeStorageAccess } from "./parse-shader-access.js";

export function toShaderHeaderInputs(descriptor: ShaderDescriptor): string {
    const { uniforms, storage } = descriptor;
    const parts: string[] = [];

    // Add workgroup_size attribute for compute shaders
    if (isComputeShaderDescriptor(descriptor)) {
        const { workgroupSize = [1, 1, 1] } = descriptor;
        parts.push(`@workgroup_size(${workgroupSize.join(', ')})`);
    }

    // Generate vertex input struct if this is a graphics shader
    if (isGraphicShaderDescriptor(descriptor) && descriptor.attributes && Object.keys(descriptor.attributes).length > 0) {
        const attributeEntries = Object.entries(descriptor.attributes)
            .map(([name, type], index) => `    @location(${index}) ${name}: ${toWGSLType(type)}`)
            .join(',\n');
            
        parts.push(`struct VertexInput {\n${attributeEntries}\n}`);
    }

    // Handle uniforms
    if (uniforms && Object.keys(uniforms).length > 0) {
        const uniformEntries = Object.entries(uniforms)
            .map(([name, type]) => `    ${name}: ${toWGSLType(type as ResourceType)}`)
            .join(',\n');

        parts.push(
            `struct Uniforms {\n${uniformEntries}\n}`,
            `@group(0) @binding(0) var<uniform> uniforms: Uniforms;`
        );
    }

    let bindingIndex = uniforms ? 1 : 0;

    // Handle textures and samplers only for graphics shaders
    if (isGraphicShaderDescriptor(descriptor)) {
        const { textures, samplers } = descriptor;

        // Handle textures
        if (textures && Object.keys(textures).length > 0) {
            const textureBindings = Object.entries(textures)
                .map(([name, type]) => 
                    `@group(0) @binding(${bindingIndex++}) var ${name}: ${toWGSLType(type as ResourceType)};`
                );
            parts.push(...textureBindings);
        }

        // Handle samplers
        if (samplers && Object.keys(samplers).length > 0) {
            const samplerBindings = Object.entries(samplers)
                .map(([name, type]) => 
                    `@group(0) @binding(${bindingIndex++}) var ${name}: ${toWGSLType(type as ResourceType)};`
                );
            parts.push(...samplerBindings);
        }
    }

    // Handle storage buffers
    if (storage && Object.keys(storage).length > 0) {
        if (isComputeShaderDescriptor(descriptor)) {
            // For compute shaders, analyze read/write access
            const storageAccess = parseComputeStorageAccess(descriptor.source, Object.keys(storage));
            const storageBindings = Object.entries(storage)
                .map(([name, type]) => {
                    const typeStr = Array.isArray(type) ? toWGSLType(type[0]) : toWGSLType(type as ResourceType);
                    const access = storageAccess[name];
                    const accessMode = access.write ? "read_write" : "read";
                    return `@group(0) @binding(${bindingIndex++}) var<storage, ${accessMode}> ${name}: array<${typeStr}>;`;
                });
            parts.push(...storageBindings);
        } else {
            // For graphics shaders, use read-only for storage buffers to match bind group layout
            const storageBindings = Object.entries(storage)
                .map(([name, type]) => {
                    const typeStr = Array.isArray(type) ? toWGSLType(type[0]) : toWGSLType(type as ResourceType);
                    return `@group(0) @binding(${bindingIndex++}) var<storage, read> ${name}: array<${typeStr}>;`;
                });
            parts.push(...storageBindings);
        }
    }

    return parts.join('\n\n');
}
