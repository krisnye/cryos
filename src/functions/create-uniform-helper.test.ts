import { expect, test, describe, vi } from "vitest";
import { createUniformHelper } from "./create-uniform-helper.js";

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

    const createMockCommandEncoder = () => ({
        finish: vi.fn()
    } as unknown as GPUCommandEncoder);

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
        const encoder = createMockCommandEncoder();

        // Initial state should trigger a write
        helper.maybeWriteToGPU(encoder);
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);

        // No changes, should not write
        helper.maybeWriteToGPU(encoder);
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);

        // Make a change
        helper.scale = 2.0;
        helper.maybeWriteToGPU(encoder);
        expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2);
    });

});
