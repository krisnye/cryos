import { sizeOf } from "./types/data-functions.js";
import { toWGSLType } from "./types/resource-functions.js";
import { VertexType, VertexAttributes, ResourceType } from "./types/resource-types.js";
import { GraphicShaderDescriptor } from "./types/shader-types.js";

export const vertexTypeToGPUVertexFormat: Record<VertexType, GPUVertexFormat> = {
    // Scalar formats
    "i32": "sint32",
    "u32": "uint32",
    "f32": "float32",
    // Vector formats
    "vec2": "float32x2",
    "vec3": "float32x3",
    "vec4": "float32x4",
}

export function toGPUVertexBufferLayout(attributes: VertexAttributes): GPUVertexBufferLayout {
    const vertexAttributes: GPUVertexAttribute[] = [];
    let arrayStride = 0;

    for (const type of Object.values(attributes)) {
        vertexAttributes.push({
            format: vertexTypeToGPUVertexFormat[type],
            offset: arrayStride,
            shaderLocation: vertexAttributes.length
        });
        arrayStride += sizeOf(type);
    }

    return {
        arrayStride,
        attributes: vertexAttributes,
        stepMode: 'vertex'
    };
}

/**
 * Converts a shader descriptor into a string of WGSL code with proper bindings.
 * @param shaderDescriptor The shader descriptor to convert.
 */
export function toShaderHeaderVertexInputAndUniforms(shaderDescriptor: GraphicShaderDescriptor): string {
    const { vertex, fragment } = shaderDescriptor;
    let output = '';

    // Generate vertex input struct if there are attributes
    if (Object.keys(vertex.attributes).length > 0) {
        output += 'struct VertexInput {\n';
        Object.entries(vertex.attributes).forEach(([name, type], index) => {
            output += `    @location(${index}) ${name}: ${toWGSLType(type)},\n`;
        });
        output += '}\n\n';
    }

    // Handle uniforms
    const vertexUniforms = vertex.uniforms || {};
    const fragmentUniforms = fragment.uniforms || {};
    const allUniforms = { ...vertexUniforms, ...fragmentUniforms };

    if (Object.keys(allUniforms).length > 0) {
        output += 'struct Uniforms {\n';
        Object.entries(allUniforms).forEach(([name, type]) => {
            output += `    ${name}: ${toWGSLType(type as ResourceType)},\n`;
        });
        output += '}\n\n';

        // Determine visibility based on where the uniform is used
        const visibility: ('vertex' | 'fragment')[] = [];
        if (Object.keys(vertexUniforms).length > 0) visibility.push('vertex');
        if (Object.keys(fragmentUniforms).length > 0) visibility.push('fragment');
        
        output += `@group(0) @binding(0) var<uniform> uniforms: Uniforms;  // ${visibility.join(', ')} shader\n\n`;
    }

    // Handle textures
    const vertexTextures = vertex.textures || {};
    const fragmentTextures = fragment.textures || {};
    let bindingOffset = Object.keys(allUniforms).length > 0 ? 1 : 0;

    Object.entries(vertexTextures).forEach(([name, type], index) => {
        output += `@group(0) @binding(${bindingOffset + index}) var ${name}: ${toWGSLType(type as ResourceType)};  // vertex shader\n`;
    });

    Object.entries(fragmentTextures).forEach(([name, type], index) => {
        const binding = bindingOffset + Object.keys(vertexTextures).length + index;
        output += `@group(0) @binding(${binding}) var ${name}: ${toWGSLType(type as ResourceType)};  // fragment shader\n`;
    });

    // Handle samplers
    const vertexSamplers = vertex.samplers || {};
    const fragmentSamplers = fragment.samplers || {};
    bindingOffset += Object.keys(vertexTextures).length + Object.keys(fragmentTextures).length;

    Object.entries(vertexSamplers).forEach(([name, type], index) => {
        output += `@group(0) @binding(${bindingOffset + index}) var ${name}: ${toWGSLType(type as ResourceType)};  // vertex shader\n`;
    });

    Object.entries(fragmentSamplers).forEach(([name, type], index) => {
        const binding = bindingOffset + Object.keys(vertexSamplers).length + index;
        output += `@group(0) @binding(${binding}) var ${name}: ${toWGSLType(type as ResourceType)};  // fragment shader\n`;
    });

    // Handle storage buffers
    const vertexStorage = vertex.storage || {};
    const fragmentStorage = fragment.storage || {};
    bindingOffset += Object.keys(vertexSamplers).length + Object.keys(fragmentSamplers).length;

    Object.entries(vertexStorage).forEach(([name, type], index) => {
        const typeStr = Array.isArray(type) ? toWGSLType(type[0]) : toWGSLType(type as ResourceType);
        output += `@group(0) @binding(${bindingOffset + index}) var<storage, read_write> ${name}: array<${typeStr}>;  // vertex shader\n`;
    });

    Object.entries(fragmentStorage).forEach(([name, type], index) => {
        const binding = bindingOffset + Object.keys(vertexStorage).length + index;
        const typeStr = Array.isArray(type) ? toWGSLType(type[0]) : toWGSLType(type as ResourceType);
        output += `@group(0) @binding(${binding}) var<storage, read_write> ${name}: array<${typeStr}>;  // fragment shader\n`;
    });

    return output.trim();
}

