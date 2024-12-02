import { expect, test, describe } from "vitest";
import { toGPUVertexBufferLayout, toShaderHeaderVertexInputAndUniforms } from "./gpu-functions.js";
import { VertexAttributes } from "./types/resource-types.js";
import { GraphicShaderDescriptor } from "./types/shader-types.js";

describe("toGPUVertexBufferLayout", () => {
    test("should create layout for single attribute", () => {
        const attributes: VertexAttributes = {
            position: "vec3"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(12); // 3 * 4 bytes
        expect(layout.attributes).toHaveLength(1);
        expect(layout.attributes[0]).toEqual({
            format: "float32x3",
            offset: 0,
            shaderLocation: 0
        });
        expect(layout.stepMode).toBe("vertex");
    });

    test("should create layout for multiple attributes", () => {
        const attributes: VertexAttributes = {
            position: "vec3",
            color: "vec4",
            texCoord: "vec2"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(36); // (3 + 4 + 2) * 4 bytes
        expect(layout.attributes).toHaveLength(3);

        // Position attribute
        expect(layout.attributes[0]).toEqual({
            format: "float32x3",
            offset: 0,
            shaderLocation: 0
        });

        // Color attribute
        expect(layout.attributes[1]).toEqual({
            format: "float32x4",
            offset: 12, // After position
            shaderLocation: 1
        });

        // TexCoord attribute
        expect(layout.attributes[2]).toEqual({
            format: "float32x2",
            offset: 28, // After position and color
            shaderLocation: 2
        });
    });

    test("should handle scalar types", () => {
        const attributes: VertexAttributes = {
            intensity: "f32",
            index: "i32"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(8); // 2 * 4 bytes
        expect(layout.attributes).toHaveLength(2);

        expect(layout.attributes[0]).toEqual({
            format: "float32",
            offset: 0,
            shaderLocation: 0
        });

        expect(layout.attributes[1]).toEqual({
            format: "sint32",
            offset: 4,
            shaderLocation: 1
        });
    });

    test("should throw for invalid vertex type", () => {
        const attributes = {
            position: "invalid_type" as any
        };

        expect(() => toGPUVertexBufferLayout(attributes))
            .toThrow();
    });
});

describe("toShaderHeaderVertexInputAndUniforms", () => {
    test("should generate vertex input struct", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {
                    position: "vec3",
                    color: "vec4"
                }
            },
            fragment: {},
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
            `struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec4<f32>,
}`);
    });

    test("should generate uniforms struct with correct visibility", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {},
                uniforms: {
                    modelMatrix: "mat4x4",
                    time: "f32"
                }
            },
            fragment: {
                uniforms: {
                    color: "vec4",
                    time: "f32" // Intentionally duplicated to test merging
                }
            },
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
            `struct Uniforms {
    modelMatrix: mat4x4<f32>,
    time: f32,
    color: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;  // vertex, fragment shader`);
    });

    test("should handle textures with correct bindings", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {},
                textures: {
                    heightMap: "texture_2d"
                }
            },
            fragment: {
                textures: {
                    diffuse: "texture_2d",
                    normal: "texture_2d"
                }
            },
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
`@group(0) @binding(0) var heightMap: texture_2d;  // vertex shader
@group(0) @binding(1) var diffuse: texture_2d;  // fragment shader
@group(0) @binding(2) var normal: texture_2d;  // fragment shader`);
    });

    test("should handle samplers with correct bindings", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {},
                samplers: {
                    vertSampler: "sampler"
                }
            },
            fragment: {
                samplers: {
                    fragSampler: "sampler_comparison"
                }
            },
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
`@group(0) @binding(0) var vertSampler: sampler;  // vertex shader
@group(0) @binding(1) var fragSampler: sampler_comparison;  // fragment shader`);
    });

    test("should handle storage buffers with correct bindings", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {},
                storage: {
                    particles: "vec4"
                }
            },
            fragment: {
                storage: {
                    output: ["vec4", 100]
                }
            },
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
`@group(0) @binding(0) var<storage, read_write> particles: array<vec4<f32>>;  // vertex shader
@group(0) @binding(1) var<storage, read_write> output: array<vec4<f32>>;  // fragment shader`
        );
    });

    test("should handle complex shader with all resource types", () => {
        const shader: GraphicShaderDescriptor = {
            vertex: {
                attributes: {
                    position: "vec3",
                    normal: "vec3"
                },
                uniforms: {
                    model: "mat4x4"
                },
                textures: {
                    heightMap: "texture_2d"
                }
            },
            fragment: {
                uniforms: {
                    color: "vec4"
                },
                textures: {
                    albedo: "texture_2d"
                },
                samplers: {
                    defaultSampler: "sampler"
                },
                storage: {
                    output: "vec4"
                }
            },
            source: ""
        };

        const result = toShaderHeaderVertexInputAndUniforms(shader);
        expect(result).toEqual(
`struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
}

struct Uniforms {
    model: mat4x4<f32>,
    color: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;  // vertex, fragment shader

@group(0) @binding(1) var heightMap: texture_2d;  // vertex shader
@group(0) @binding(2) var albedo: texture_2d;  // fragment shader
@group(0) @binding(3) var defaultSampler: sampler;  // fragment shader
@group(0) @binding(4) var<storage, read_write> output: array<vec4<f32>>;  // fragment shader`);
    });
});