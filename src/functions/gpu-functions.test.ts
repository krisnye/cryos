import { expect, test, describe } from "vitest";
import { toShaderHeaderInputs } from "./to-shader-header-inputs.js";
import { toGPUVertexBufferLayout } from "./to-gpu-vertex-buffer-layout.js";
import { VertexAttributes } from "../types/resource-types.js";
import { GraphicShaderDescriptor } from "../types/shader-types.js";

// Add custom matcher
interface CustomMatchers<R = unknown> {
  toContainDeclaration: (declaration: string) => R;
}

declare module "vitest" {
  interface Assertion extends CustomMatchers {}
}

expect.extend({
  toContainDeclaration(received: string, declaration: string) {
    const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim();
    const contains = normalizeWhitespace(received).includes(normalizeWhitespace(declaration));

    return {
      pass: contains,
      message: () => 
        contains 
          ? `Expected shader not to contain "${declaration}"`
          : `Expected shader to contain "${declaration}"`
    };
  }
});

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

describe("toShaderHeaderInputs", () => {
    test("should generate vertex input struct", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {
                position: "vec3",
                color: "vec4"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        
        expect(result).toContainDeclaration("@location(0) position: vec3<f32>");
        expect(result).toContainDeclaration("@location(1) color: vec4<f32>");
        expect(result).toMatch(/struct\s+VertexInput\s*{[^}]+}/);
    });

    test("should generate uniforms struct with correct visibility", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                modelMatrix: "mat4x4",
                time: "f32",
                color: "vec4",
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        
        expect(result).toContainDeclaration("modelMatrix: mat4x4<f32>");
        expect(result).toContainDeclaration("time: f32");
        expect(result).toContainDeclaration("color: vec4<f32>");
        expect(result).toContainDeclaration("@group(0) @binding(0) var<uniform> uniforms: Uniforms");
    });

    test("should handle textures with correct bindings", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            textures: {
                heightMap: "texture_2d",
                diffuse: "texture_2d",
                normal: "texture_2d"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        
        expect(result).toContainDeclaration("@group(0) @binding(0) var heightMap: texture_2d");
        expect(result).toContainDeclaration("@group(0) @binding(1) var diffuse: texture_2d");
        expect(result).toContainDeclaration("@group(0) @binding(2) var normal: texture_2d");
    });

    test("should handle complex shader with all resource types", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {
                position: "vec3",
                normal: "vec3"
            },
            uniforms: {
                model: "mat4x4",
                color: "vec4"
            },
            textures: {
                heightMap: "texture_2d",
                albedo: "texture_2d"
            },
            samplers: {
                defaultSampler: "sampler"
            },
            storage: {
                output: "vec4"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);

        // Check vertex inputs
        expect(result).toContainDeclaration("@location(0) position: vec3<f32>");
        expect(result).toContainDeclaration("@location(1) normal: vec3<f32>");

        // Check uniforms
        expect(result).toContainDeclaration("model: mat4x4<f32>");
        expect(result).toContainDeclaration("color: vec4<f32>");
        expect(result).toContainDeclaration("@group(0) @binding(0) var<uniform> uniforms: Uniforms");

        // Check textures and samplers
        expect(result).toContainDeclaration("@group(0) @binding(1) var heightMap: texture_2d");
        expect(result).toContainDeclaration("@group(0) @binding(2) var albedo: texture_2d");
        expect(result).toContainDeclaration("@group(0) @binding(3) var defaultSampler: sampler");

        // Check storage
        expect(result).toContainDeclaration("@group(0) @binding(4) var<storage, read_write> output: array<vec4<f32>>");
    });
});