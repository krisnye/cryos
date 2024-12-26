import { expect, test, describe, vi } from "vitest";
import { toBindGroupLayoutDescriptor } from "./to-bind-group-layout-descriptor.js";
import { GraphicShaderDescriptor } from "../types/shader-types.js";

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

});
