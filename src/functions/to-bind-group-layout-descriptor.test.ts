import { expect, test, describe, vi } from "vitest";
import { toBindGroupLayoutDescriptor } from "./to-bind-group-layout-descriptor.js";
import { GraphicShaderDescriptor, ComputeShaderDescriptor } from "../types/shader-types.js";

describe("createBindGroupLayoutDescriptor", () => {
    test("should create layout for uniforms only", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                modelMatrix: "mat4x4",
                time: "f32"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let t = time;
                    let pos = vec4<f32>(0.0, 0.0, 0.0, 1.0) * modelMatrix;
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0);
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }]
        });
    });

    test("should handle uniform visibility from vertex main", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                time: "f32",
                modelMatrix: "mat4x4"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let t = time;
                    let pos = vec4<f32>(0.0, 0.0, 0.0, 1.0) * modelMatrix;
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0);
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }]
        });
    });

    test("should handle shared uniform visibility between vertex and fragment", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                time: "f32",
                modelMatrix: "mat4x4"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let t = time;
                    let pos = vec4<f32>(0.0, 0.0, 0.0, 1.0) * modelMatrix;
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0) * time;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            }]
        });
    });

    test("should handle uniform visibility from fragment main", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                time: "f32",
                modelMatrix: "mat4x4"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let pos = vec4<f32>(0.0, 0.0, 0.0, 1.0);
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0) * time * modelMatrix;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            }]
        });
    });

    test("should warn if uniforms are not found in either vertex or fragment main", () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            uniforms: {
                time: "f32",
                modelMatrix: "mat4x4"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let pos = vec4<f32>(0.0, 0.0, 0.0, 1.0);
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0);
                }
            `
        };

        toBindGroupLayoutDescriptor(shader);
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Found unused resources in shader:')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('uniforms: time')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('uniforms: modelMatrix')
        );

        consoleSpy.mockRestore();
    });

    test("should handle textures with proper visibility", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            textures: {
                heightMap: "texture_2d",
                diffuse: "texture_2d"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let height = textureSample(heightMap, heightSampler, vec2<f32>(0.5));
                    return vec4<f32>(height.x);
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    let color = textureSample(diffuse, diffuseSampler, vec2<f32>(0.5));
                    return color;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                texture: {
                    sampleType: "float",
                    viewDimension: "2d"
                }
            }, {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: "float",
                    viewDimension: "2d"
                }
            }]
        });
    });

    test("should handle shared storage buffer visibility", () => {
        const shader: GraphicShaderDescriptor = {
            attributes: {},
            storage: {
                particles: "vec4",
                shared_data: "vec3",
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let pos = particles[0];
                    return pos;
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    let data = shared_data[0];
                    return vec4<f32>(data, 1.0);
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: false,
                    type: "storage"
                }
            }, {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    hasDynamicOffset: false,
                    type: "storage"
                }
            }]
        });
    });

    test("should handle shared sampler and texture visibility", () => {
        const shader: GraphicShaderDescriptor = {
            textures: {
                heightMap: "texture_2d",
                shared_tex: "texture_2d"
            },
            samplers: {
                shared_sampler: "sampler",
                fragOnly: "sampler_comparison"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    let height = textureSample(heightMap, shared_sampler, vec2<f32>(0.5));
                    let shared = textureSample(shared_tex, shared_sampler, vec2<f32>(0.5));
                    return vec4<f32>(height.x + shared.x);
                }

                fn fragment_main() -> @location(0) vec4<f32> {
                    let height = textureSample(heightMap, shared_sampler, vec2<f32>(0.5));
                    let color = textureSample(diffuse, fragOnly, vec2<f32>(0.5));
                    return color;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: "float",
                    viewDimension: "2d"
                }
            }, {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                texture: {
                    sampleType: "float",
                    viewDimension: "2d"
                }
            }, {
                binding: 2,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                sampler: {
                    type: "filtering"
                }
            }, {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {
                    type: "filtering"
                }
            }]
        });
    });

    test("should handle compute shader with read/write storage buffers", () => {
        const shader: ComputeShaderDescriptor = {
            workgroup_size: [64, 1, 1],
            uniforms: {
                params: "vec4"
            },
            storage: {
                inputData: "f32",
                outputData: "f32"
            },
            source: `
                fn compute_main() {
                    // Read from input
                    let value = inputData[0];
                    
                    // Write to output
                    outputData[0] = value * 2.0;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });
    });

    test("should handle compute shader with only uniforms", () => {
        const shader: ComputeShaderDescriptor = {
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
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform"
                    }
                }
            ]
        });
    });

    test("should handle compute shader with only read-only storage", () => {
        const shader: ComputeShaderDescriptor = {
            workgroup_size: [64, 1, 1],
            storage: {
                data1: "f32",
                data2: "vec4"
            },
            source: `
                fn compute_main() {
                    let x = data1[0];
                    let y = data2[0].xy;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });
    });

    test("should warn if compute shader entry point is not found", () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        
        const shader: ComputeShaderDescriptor = {
            workgroup_size: [64, 1, 1],
            storage: {
                data: "f32"
            },
            source: `
                fn wrong_main() {
                    data[0] = 1.0;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        
        expect(consoleSpy).toHaveBeenCalledWith("Compute shader entry point not found");
        expect(layout.entries).toEqual([
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "read-only-storage",
                    hasDynamicOffset: false
                }
            }
        ]);

        consoleSpy.mockRestore();
    });

    test("should handle complex storage access patterns in compute shader", () => {
        const shader: ComputeShaderDescriptor = {
            workgroup_size: [64, 1, 1],
            storage: {
                readOnly: "f32",
                writeStruct: "vec4",
                readWrite: "f32",
                storeTarget: "f32"
            },
            source: `
                fn compute_main() {
                    // Read only access
                    let x = readOnly[0];
                    
                    // Write through struct field
                    writeStruct[0].x = 1.0;
                    
                    // Both read and write
                    readWrite[1] = readWrite[0] * 2.0;
                    
                    // Write through store operation
                    store &storeTarget, 1.0;
                }
            `
        };

        const layout = toBindGroupLayoutDescriptor(shader);
        expect(layout).toEqual({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });
    });

});
