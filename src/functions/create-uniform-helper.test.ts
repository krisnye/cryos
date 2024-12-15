import { expect, test, describe, vi } from "vitest";
import { createUniformHelper } from "./create-uniform-helper.js";
import { sizeOf } from "./size-of.js";

describe("createUniformHelper", () => {
    // Mock GPUDevice and related types
    const createMockDevice = () => ({
        createBuffer: vi.fn().mockReturnValue({
            destroy: vi.fn()
        }),
        queue: {
            writeBuffer: vi.fn()
        }
    } as unknown as GPUDevice);

    test("should handle basic scalar types", () => {
        const device = createMockDevice();
        const types = {
            time: "f32" as const,
            count: "i32" as const,
            flags: "u32" as const
        };
        
        const initialValues = {
            time: 1.5,
            count: -42,
            flags: 7
        };

        const helper = createUniformHelper(device, types, initialValues);

        // Verify initial values
        expect(helper.time).toBe(1.5);
        expect(helper.count).toBe(-42);
        expect(helper.flags).toBe(7);

        // Verify buffer was created with correct size (3 * 4 bytes)
        expect(device.createBuffer).toHaveBeenCalledWith({
            size: 12,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    });

    test("should handle vector types", () => {
        const device = createMockDevice();
        const types = {
            position: "vec3" as const,
            color: "vec4" as const
        };
        
        const initialValues = {
            position: [1, 2, 3],
            color: [1, 0, 0, 1]
        } as const;

        const helper = createUniformHelper(device, types, initialValues);

        // Verify initial values
        expect(helper.position).toEqual([1, 2, 3]);
        expect(helper.color).toEqual([1, 0, 0, 1]);

        // Update values
        helper.position = [4, 5, 6];
        expect(helper.position).toEqual([4, 5, 6]);
    });

    test("should handle struct types", () => {
        const device = createMockDevice();
        const types = {
            light: {
                position: "vec3" as const,
                color: "vec3" as const,
                intensity: "f32" as const
            }
        };
        
        const initialValues = {
            light: {
                position: [1, 2, 3],
                color: [1, 1, 1],
                intensity: 0.5
            }
        } as const;

        const helper = createUniformHelper(device, types, initialValues);

        // Verify initial values
        expect(helper.light).toEqual(initialValues.light);

        // Update nested value
        helper.light = {
            ...helper.light,
            intensity: 0.8
        };
        expect(helper.light.intensity).toBe(0.8);
    });

    test("should write to GPU only when dirty", () => {
        const device = createMockDevice();
        const types = {
            position: "vec3" as const,
            scale: "f32" as const
        };
        
        const initialValues = {
            position: [0, 0, 0],
            scale: 1.0
        } as const;

        const helper = createUniformHelper(device, types, initialValues);

        // Initial state should trigger a write
        helper.maybeWriteToGPU();
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);

        // No changes, should not write
        helper.maybeWriteToGPU();
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);

        // Make a change
        helper.scale = 2.0;
        helper.maybeWriteToGPU();
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2);
    });

    test("should handle nested structs and verify buffer contents", () => {
        const device = createMockDevice();
        const types = {
            scene: {
                camera: {
                    position: "vec3" as const,
                    fov: "f32" as const
                },
                lighting: {
                    ambient: "vec3" as const,
                    intensity: "f32" as const
                }
            }
        };

        // Create a mock buffer to capture written data
        let capturedData: ArrayBuffer | null = null;
        const mockWriteBuffer = vi.fn().mockImplementation((buffer, offset, data) => {
            capturedData = data;
        });

        device.queue.writeBuffer = mockWriteBuffer;
        
        const initialValues = {
            scene: {
                camera: {
                    position: [1, 2, 3],
                    fov: 45.0
                },
                lighting: {
                    ambient: [0.1, 0.2, 0.3],
                    intensity: 0.5
                }
            }
        } as const;

        const helper = createUniformHelper(device, types, initialValues);

        // Verify the structure was created correctly
        expect(helper.scene.camera.position).toEqual([1, 2, 3]);
        expect(helper.scene.camera.fov).toBe(45.0);
        expect(helper.scene.lighting.ambient).toEqual([0.1, 0.2, 0.3]);
        expect(helper.scene.lighting.intensity).toBe(0.5);

        // Verify buffer was created with correct size (16 * 4 bytes)
        expect(device.createBuffer).toHaveBeenCalledWith({
            size: 64, // 16 floats * 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Clear previous captured data
        capturedData = null;
        helper.maybeWriteToGPU();

        // Initial write to GPU should happen automatically
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);
        
        // Verify buffer contents
        const expectedData = new Float32Array([
            // camera struct (32 bytes)
            // position (vec3 + padding)
            1, 2, 3, 0,  
            // fov (f32 + padding to 16-byte boundary)
            45.0, 0, 0, 0,
            
            // lighting struct (32 bytes)
            // ambient (vec3 + padding)
            0.1, 0.2, 0.3, 0,
            // intensity (f32 + padding to 16-byte boundary)
            0.5, 0, 0, 0
        ]);

        // Convert captured data to Float32Array for comparison
        const actualData = new Float32Array(capturedData!);

        // Compare the arrays
        expect(Array.from(actualData)).toEqual(Array.from(expectedData));
    });

});

