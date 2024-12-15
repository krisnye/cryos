import { expect, test, describe } from "vitest"
import { createTypedBufferWriter } from "./create-typed-buffer-writer.js"

describe("createTypedBufferWriter", () => {
    test("should write scalar values with proper alignment", () => {
        const writer = createTypedBufferWriter(16)

        writer.write("f32", 1.5, 0)
        writer.write("i32", -42, 4)
        writer.write("u32", 7, 8)

        expect(writer.f32Array[0]).toBe(1.5)
        expect(writer.i32Array[1]).toBe(-42)
        expect(writer.u32Array[2]).toBe(7)
    })

    test("should write vectors with proper alignment", () => {
        const writer = createTypedBufferWriter(32)

        writer.write("vec4", [1, 2, 3, 4], 0)
        writer.write("vec2", [5, 6], 16)

        expect(Array.from(writer.f32Array.slice(0, 4))).toEqual([1, 2, 3, 4])
        expect(Array.from(writer.f32Array.slice(4, 6))).toEqual([5, 6])
    })

    test("should handle vec3 padding", () => {
        const writer = createTypedBufferWriter(32)

        const bytesWritten = writer.write("vec3", [1, 2, 3], 0)
        
        expect(Array.from(writer.f32Array.slice(0, 4))).toEqual([1, 2, 3, 0])
        expect(bytesWritten).toBe(16) // vec3 is padded to 16 bytes
    })

    test("should handle struct types", () => {
        const writer = createTypedBufferWriter(64)
        
        const structType = {
            position: "vec3" as const,
            intensity: "f32" as const
        }

        const value = {
            position: [1, 2, 3],
            intensity: 0.5
        }

        writer.write(structType, value, 0)

        expect(Array.from(writer.f32Array.slice(0, 5))).toEqual([1, 2, 3, 0, 0.5])
    })

    test("should handle nested structs", () => {
        const writer = createTypedBufferWriter(64)
        
        const structType = {
            transform: {
                position: "vec3" as const,
                scale: "f32" as const
            },
            color: "vec4" as const
        }

        const value = {
            transform: {
                position: [1, 2, 3],
                scale: 2.0
            },
            color: [1, 0, 0, 1]
        }

        writer.write(structType, value, 0)

        // First vec3 + padding, then f32 + padding to 16-byte boundary
        expect(Array.from(writer.f32Array.slice(0, 8))).toEqual([1, 2, 3, 0, 2.0, 0, 0, 0])
        // Then vec4
        expect(Array.from(writer.f32Array.slice(8, 12))).toEqual([1, 0, 0, 1])
    })

    test("should handle alignment requirements", () => {
        const writer = createTypedBufferWriter(32)

        writer.write("f32", 1.5, 0)
        expect(writer.f32Array[0]).toBe(1.5)

        writer.write("vec2", [1, 2], 5)
        expect(Array.from(writer.f32Array.slice(2, 4))).toEqual([1, 2])
    })
}) 