import { expect, test, describe } from "vitest";
import { toShaderHeaderInputs } from "./to-shader-header-inputs.js";
import { ComputeShaderDescriptor, GraphicShaderDescriptor } from "../types/shader-types.js";

describe("toShaderHeaderInputs", () => {
    test("should generate vertex input struct", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {
                position: "vec3",
                uv: "vec2",
                normal: "vec3"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) normal: vec3<f32>
}`
        );
    });

    test("should generate uniform bindings", () => {
        const shader: GraphicShaderDescriptor = {
            uniforms: {
                modelMatrix: "mat4x4",
                color: "vec4",
                time: "f32"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `struct Uniforms {
    modelMatrix: mat4x4<f32>,
    color: vec4<f32>,
    time: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;`
        );
    });

    test("should generate texture bindings", () => {
        const shader: GraphicShaderDescriptor = {
            textures: {
                diffuseMap: "texture_2d",
                normalMap: "texture_2d"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `@group(0) @binding(0) var diffuseMap: texture_2d<f32>;

@group(0) @binding(1) var normalMap: texture_2d<f32>;`
        );
    });

    test("should generate sampler bindings", () => {
        const shader: GraphicShaderDescriptor = {
            samplers: {
                diffuseSampler: "sampler",
                shadowSampler: "sampler_comparison"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `@group(0) @binding(0) var diffuseSampler: sampler;

@group(0) @binding(1) var shadowSampler: sampler_comparison;`
        );
    });

    test("should generate storage buffer bindings", () => {
        const shader: GraphicShaderDescriptor = {
            storage: {
                particles: "vec4",
                indices: "u32"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `@group(0) @binding(0) var<storage, read_write> particles: array<vec4<f32>>;

@group(0) @binding(1) var<storage, read_write> indices: array<u32>;`
        );
    });

    test("should handle all resource types together with correct binding indices", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {
                position: "vec3",
                normal: "vec3"
            },
            uniforms: {
                modelMatrix: "mat4x4",
                time: "f32"
            },
            textures: {
                diffuseMap: "texture_2d"
            },
            samplers: {
                defaultSampler: "sampler"
            },
            storage: {
                particles: "vec4"
            },
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>
}

struct Uniforms {
    modelMatrix: mat4x4<f32>,
    time: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(0) @binding(1) var diffuseMap: texture_2d<f32>;

@group(0) @binding(2) var defaultSampler: sampler;

@group(0) @binding(3) var<storage, read_write> particles: array<vec4<f32>>;`
        );
    });

    test("should handle empty descriptor", () => {
        const shader: GraphicShaderDescriptor = {
            source: ""
        };

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe("");
    });

    test("should generate compute shader uniform bindings", () => {
        const shader = {
            workgroup_size: [64, 1, 1],
            uniforms: {
                params: "vec4",
                time: "f32"
            },
            source: `
                fn compute_main() {
                    let t = params.x * time;
                }
            `
        } as const satisfies ComputeShaderDescriptor;

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `struct Uniforms {
    params: vec4<f32>,
    time: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;`
        );
    });

    test("should generate compute shader storage bindings with read/write access", () => {
        const shader = {
            workgroup_size: [64, 1, 1],
            storage: {
                inputData: "f32",
                outputData: "f32"
            },
            source: `
                fn compute_main() {
                    // Read only from input
                    let value = inputData[0];
                    
                    // Write to output
                    outputData[0] = value * 2.0;
                }
            `
        } as const satisfies ComputeShaderDescriptor;

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `@group(0) @binding(0) var<storage, read> inputData: array<f32>;

@group(0) @binding(1) var<storage, read_write> outputData: array<f32>;`
        );
    });

    test("should handle compute shader with mixed storage access patterns", () => {
        const shader = {
            workgroup_size: [64, 1, 1],
            storage: {
                readOnly: "vec4",
                readWrite: "vec4",
                writeOnly: "f32",
                structAccess: "vec4"
            },
            source: `
                fn compute_main() {
                    // Read only access
                    let x = readOnly[0];
                    
                    // Read and write access
                    readWrite[0] = readWrite[1] * 2.0;
                    
                    // Write only access
                    writeOnly[0] = 1.0;
                    
                    // Struct field write
                    structAccess[0].x = 1.0;
                }
            `
        } as const satisfies ComputeShaderDescriptor;

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `@group(0) @binding(0) var<storage, read> readOnly: array<vec4<f32>>;

@group(0) @binding(1) var<storage, read_write> readWrite: array<vec4<f32>>;

@group(0) @binding(2) var<storage, read_write> writeOnly: array<f32>;

@group(0) @binding(3) var<storage, read_write> structAccess: array<vec4<f32>>;`
        );
    });

    test("should handle compute shader with all resource types", () => {
        const shader = {
            workgroup_size: [64, 1, 1],
            uniforms: {
                params: "vec4",
                time: "f32"
            },
            storage: {
                input: "vec4",
                output: "vec4"
            },
            source: `
                fn compute_main() {
                    let t = time * params.x;
                    let value = input[0];
                    output[0] = value * t;
                }
            `
        } as const satisfies ComputeShaderDescriptor;

        const result = toShaderHeaderInputs(shader);
        expect(result).toBe(
            `struct Uniforms {
    params: vec4<f32>,
    time: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(0) @binding(1) var<storage, read> input: array<vec4<f32>>;

@group(0) @binding(2) var<storage, read_write> output: array<vec4<f32>>;`
        );
    });
}); 