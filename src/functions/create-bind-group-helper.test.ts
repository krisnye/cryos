import { expect, test, describe, vi } from "vitest";
import { createBindGroupHelper } from "./create-bind-group-helper.js";
import { GraphicShaderDescriptor } from "../types/shader-types.js";

describe("createBindGroupHelper", () => {
    // Mock GPUDevice and related types
    const createMockDevice = () => ({
        createBuffer: vi.fn().mockReturnValue({
            destroy: vi.fn()
        }),
        createBindGroupLayout: vi.fn().mockReturnValue({}),
        createBindGroup: vi.fn().mockReturnValue({}),
        queue: {
            writeBuffer: vi.fn()
        }
    } as unknown as GPUDevice);

    test("should handle uniforms only", () => {
        const device = createMockDevice();
        const descriptor = {
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
            `
        } as const satisfies GraphicShaderDescriptor;

        const helper = createBindGroupHelper(device, descriptor, {
            modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            time: 0
        }, {});

        // Verify initial state
        expect(helper.uniforms.time).toBe(0);
        expect(Array.from(helper.uniforms.modelMatrix)).toEqual([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
        ]);

        // Update values
        helper.uniforms.time = 1.5;
        helper.maybeWriteToGPU();

        const bindGroup = helper.getBindGroup();

        // Verify bind group was created
       expect(device.createBindGroup).toHaveBeenCalled();
    });

    test("should handle textures and samplers", () => {
        const device = createMockDevice();
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d",
                normal: "texture_2d"
            },
            samplers: {
                defaultSampler: "sampler"
            },
            source: `
                fn fragment_main() -> @location(0) vec4<f32> {
                    normal,
                    return textureSample(diffuse, defaultSampler, vec2<f32>(0.5));
                }
            `
        };

        const mockTexture = {
            createView: vi.fn().mockReturnValue({})
        } as unknown as GPUTexture;

        const mockSampler = {} as GPUSampler;

        const helper = createBindGroupHelper(device, descriptor, {}, {
            diffuse: mockTexture,
            normal: mockTexture,
            defaultSampler: mockSampler
        });

        // Get bind group should create a new bind group
        helper.getBindGroup();
        expect(device.createBindGroup).toHaveBeenCalled();

        // Changing resources should mark bind group as dirty
        const newTexture = { createView: vi.fn().mockReturnValue({}) } as unknown as GPUTexture;
        helper.resources = {
            ...helper.resources,
            diffuse: newTexture
        };

        // Should create a new bind group with updated resources
        helper.getBindGroup();
        expect(device.createBindGroup).toHaveBeenCalledTimes(2);
    });

    test("should handle storage buffers", () => {
        const device = createMockDevice();
        const descriptor: GraphicShaderDescriptor = {
            storage: {
                particles: "vec4",
                shared_data: "vec3"
            },
            source: `
                fn vertex_main() -> @builtin(position) vec4<f32> {
                    shared_data
                    let pos = particles[0];
                    return pos;
                }
            `
        };

        const mockBuffer = {
            size: 1024
        } as GPUBuffer;

        const helper = createBindGroupHelper(device, descriptor, {}, {
            particles: mockBuffer,
            shared_data: mockBuffer
        });

        // Get bind group should create a new bind group with storage buffers
        helper.getBindGroup();
        expect(device.createBindGroup).toHaveBeenCalled();

        // Verify the bind group entries contain storage buffers
        expect(device.createBindGroup).toHaveBeenCalledWith(expect.objectContaining({
            entries: expect.arrayContaining([
                expect.objectContaining({
                    resource: expect.objectContaining({
                        buffer: mockBuffer
                    })
                })
            ])
        }));
    });

    test("should throw error for missing resources", () => {
        const device = createMockDevice();
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d"
            },
            source: `
                fn fragment_main() -> @location(0) vec4<f32> {
                    diffuse
                    return textureSample(diffuse, defaultSampler, vec2<f32>(0.5));
                }
            `
        };

        const helper = createBindGroupHelper(device, descriptor, {}, {});

        expect(() => helper.getBindGroup()).toThrow("Missing texture resource: diffuse");
    });
});
