import { expect, test, describe, beforeEach, vi, afterEach } from "vitest";
import { createBindGroupHelper } from "./create-bind-group-helper.js";
import { GraphicShaderDescriptor, ComputeShaderDescriptor } from "../types/shader-types.js";
import { IsEquivalent, IsTrue } from "../types/test-types.js";
import { Vec4 } from "../types/data-types.js";

// Type tests for createBindGroupHelper
{
    const computeShader = {
        workgroup_size: [64, 1, 1] as const,
        uniforms: {
            params: "vec4",
            time: "f32"
        },
        storage: {
            inputData: "f32",
            outputData: "vec4"
        },
        source: ""
    } as const satisfies ComputeShaderDescriptor;

    // Verify helper type inference
    type Helper = ReturnType<typeof createBindGroupHelper<typeof computeShader>>;
    
    // Verify resources type
    type Resources = Helper["resources"];
    type CheckResources = IsTrue<IsEquivalent<Resources, {
        inputData: GPUBuffer;
        outputData: GPUBuffer;
    }>>;

    // Verify uniforms type
    type Uniforms = Helper["uniforms"];
    type CheckUniforms = IsTrue<IsEquivalent<Uniforms, {
        params: Vec4;
        time: number;
    }>>;
}

describe("createBindGroupHelper", () => {
    let originalConsoleWarn: typeof console.warn;
    let mockBindGroupLayout: GPUBindGroupLayout;
    let mockBuffer: GPUBuffer;
    let mockTexture: GPUTexture;
    let mockSampler: GPUSampler;
    let mockDevice: GPUDevice;

    beforeEach(() => {
        // Store the original console.warn
        originalConsoleWarn = console.warn;
        // Replace with a no-op function
        console.warn = vi.fn();

        // Setup mock objects
        mockBindGroupLayout = {} as GPUBindGroupLayout;
        mockBuffer = {
            size: 256,
            destroy: vi.fn()
        } as unknown as GPUBuffer;
        mockTexture = {
            createView: vi.fn().mockReturnValue({})
        } as unknown as GPUTexture;
        mockSampler = {} as GPUSampler;

        mockDevice = {
            createBindGroupLayout: vi.fn().mockReturnValue(mockBindGroupLayout),
            createBindGroup: vi.fn().mockReturnValue({}),
            createBuffer: vi.fn().mockReturnValue(mockBuffer)
        } as unknown as GPUDevice;

        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore the original console.warn
        console.warn = originalConsoleWarn;
        vi.restoreAllMocks();
    });

    test("should create bind group with uniforms only (graphics shader)", () => {
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

    test("should create bind group with all graphics shader resource types", () => {
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

    test("should create bind group with compute shader uniforms and storage", () => {
        const descriptor: ComputeShaderDescriptor = {
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

        const initialUniforms = {
            params: new Float32Array([1, 2, 3, 4])
        };

        const initialResources = {
            inputData: mockBuffer,
            outputData: mockBuffer
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
                    resource: {
                        buffer: mockBuffer,
                        offset: 0,
                        size: 256
                    }
                },
                {
                    binding: 2,
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

    test("should throw when required resource is missing (graphics shader)", () => {
        const descriptor: GraphicShaderDescriptor = {
            textures: {
                diffuse: "texture_2d"
            },
            source: ""
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, {}, {});
        expect(() => helper.getBindGroup()).toThrow("Missing texture resource: diffuse");
    });

    test("should throw when required resource is missing (compute shader)", () => {
        const descriptor: ComputeShaderDescriptor = {
            workgroup_size: [64, 1, 1],
            storage: {
                data: "f32"
            },
            source: ""
        };

        const helper = createBindGroupHelper(mockDevice, descriptor, {}, {});
        expect(() => helper.getBindGroup()).toThrow("Missing storage buffer resource: data");
    });

    test("should not recreate bind group if resources haven't changed", () => {
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
