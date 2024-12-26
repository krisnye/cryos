import { expect, test, describe, beforeEach, vi } from "vitest";
import { createBindGroupHelper } from "./create-bind-group-helper.js";
import { GraphicShaderDescriptor } from "../types/shader-types.js";

describe("createBindGroupHelper", () => {
    // Mock GPU objects and device
    const mockBuffer = {
        size: 256,
        destroy: vi.fn()
    } as unknown as GPUBuffer;

    const mockTexture = {
        createView: vi.fn().mockReturnValue({})
    } as unknown as GPUTexture;

    const mockSampler = {} as GPUSampler;

    const mockBindGroupLayout = {} as GPUBindGroupLayout;

    const mockDevice = {
        createBindGroupLayout: vi.fn().mockReturnValue(mockBindGroupLayout),
        createBindGroup: vi.fn().mockReturnValue({}),
        createBuffer: vi.fn().mockReturnValue(mockBuffer)
    } as unknown as GPUDevice;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("should create bind group with uniforms only", () => {
        const descriptor: GraphicShaderDescriptor = {
            uniforms: {
                modelMatrix: "mat4x4",
                color: "vec4"
            },
            source: ""
        };

        const initialUniforms = {
            modelMatrix: new Float32Array(16),
            color: new Float32Array([1, 0, 0, 1])
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, initialUniforms, {});
        helper.getBindGroup();

        expect(mockDevice.createBindGroup).toHaveBeenCalledWith({
            layout: mockBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: mockBuffer,
                        offset: 0,
                        size: expect.any(Number)
                    }
                }
            ]
        });
    });

    test("should create bind group with all resource types", () => {
        const descriptor: GraphicShaderDescriptor = {
            uniforms: {
                transform: "mat4x4"
            },
            textures: {
                diffuse: "texture_2d"
            },
            samplers: {
                defaultSampler: "sampler"
            },
            storage: {
                data: "vec4"
            },
            source: ""
        };

        const initialUniforms = {
            transform: new Float32Array(16)
        };

        const initialResources = {
            diffuse: mockTexture,
            defaultSampler: mockSampler,
            data: mockBuffer
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, initialUniforms, initialResources);
        helper.getBindGroup();

        expect(mockDevice.createBindGroup).toHaveBeenCalledWith({
            layout: mockBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: mockBuffer,
                        offset: 0,
                        size: expect.any(Number)
                    }
                },
                {
                    binding: 1,
                    resource: expect.any(Object)  // texture view
                },
                {
                    binding: 2,
                    resource: mockSampler
                },
                {
                    binding: 3,
                    resource: {
                        buffer: mockBuffer,
                        offset: 0,
                        size: 256
                    }
                }
            ]
        });
    });

    test("should recreate bind group when resources change", () => {
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d"
            },
            source: ""
        };

        const initialResources = {
            diffuse: mockTexture
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, {}, initialResources);
        helper.getBindGroup();

        const newTexture = { ...mockTexture };
        helper.resources = { diffuse: newTexture };
        helper.getBindGroup();

        expect(mockDevice.createBindGroup).toHaveBeenCalledTimes(2);
    });

    test("should throw when required resource is missing", () => {
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d"
            },
            source: ""
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, {}, {});
        expect(() => helper.getBindGroup()).toThrow("Missing texture resource: diffuse");
    });

    test("should not recreate bind group if resources haven't changed", () => {
        vi.clearAllMocks();
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d"
            },
            source: ""
        };

        const initialResources = {
            diffuse: mockTexture
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, {}, initialResources);
        helper.getBindGroup();
        helper.getBindGroup();
        helper.getBindGroup();

        expect(mockDevice.createBindGroup).toHaveBeenCalledTimes(1);
    });

    test("should cleanup resources on destroy", () => {
        const descriptor: GraphicShaderDescriptor = {
            uniforms: {
                transform: "mat4x4"
            },
            source: ""
        };

        const initialUniforms = {
            transform: new Float32Array(16)
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, initialUniforms, {});
        helper.destroy();

        expect(mockBuffer.destroy).toHaveBeenCalled();
    });
});
