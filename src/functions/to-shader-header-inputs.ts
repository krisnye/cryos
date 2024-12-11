import { ResourceType } from "../types/resource-types.js";
import { GraphicShaderDescriptor } from "../types/shader-types.js";
import { toWGSLType } from "./to-wgsl-type.js";

/**
 * Converts a shader descriptor into a string of WGSL code with proper bindings.
 * @param shaderDescriptor The shader descriptor to convert.
 */
export function toShaderHeaderInputs(shaderDescriptor: GraphicShaderDescriptor): string {
    const { attributes, uniforms, textures, samplers, storage } = shaderDescriptor;
    const parts: string[] = [];

    // Generate vertex input struct if there are attributes
    if (attributes && Object.keys(attributes).length > 0) {
        const attributeEntries = Object.entries(attributes)
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

    // Handle storage buffers
    if (storage && Object.keys(storage).length > 0) {
        const storageBindings = Object.entries(storage)
            .map(([name, type]) => {
                const typeStr = Array.isArray(type) ? toWGSLType(type[0]) : toWGSLType(type as ResourceType);
                return `@group(0) @binding(${bindingIndex++}) var<storage, read_write> ${name}: array<${typeStr}>;`;
            });
        parts.push(...storageBindings);
    }

    return parts.join('\n\n');
}
