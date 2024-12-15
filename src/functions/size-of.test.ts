import { expect, test, describe } from "vitest";
import { sizeOf } from "./size-of.js";
import { DataType } from "../types/data-types.js";

describe("sizeOf", () => {
    test("should handle scalar types", () => {
        expect(sizeOf("bool")).toBe(4);
        expect(sizeOf("i32")).toBe(4);
        expect(sizeOf("u32")).toBe(4);
        expect(sizeOf("f32")).toBe(4);
    });

    test("should handle vector types", () => {
        expect(sizeOf("vec2")).toBe(8);
        expect(sizeOf("vec3")).toBe(16); // vec3 is padded to 16 bytes
        expect(sizeOf("vec4")).toBe(16);
    });

    test("should handle matrix types", () => {
        expect(sizeOf("mat2x2")).toBe(16);
        expect(sizeOf("mat2x3")).toBe(24);
        expect(sizeOf("mat3x3")).toBe(36);
        expect(sizeOf("mat4x4")).toBe(64);
    });

    test("should handle array types", () => {
        const arrayType: DataType = ["f32", 3];
        expect(sizeOf(arrayType)).toBe(12); // 3 * 4 bytes

        const vec3ArrayType: DataType = ["vec3", 2];
        expect(sizeOf(vec3ArrayType)).toBe(32); // 2 * 16 bytes (vec3 is aligned to 16)
    });

    test("should handle struct types with proper alignment", () => {
        const structType: DataType = {
            scalar: "f32",
            vector: "vec3",
            matrix: "mat2x2"
        };

        // Expected layout:
        // scalar: 4 bytes
        // padding: 12 bytes (to align vec3 to 16-byte boundary)
        // vector: 16 bytes (vec3 padded to 16)
        // matrix: 16 bytes
        // Total: 48 bytes
        expect(sizeOf(structType)).toBe(48);
    });

    test("should handle nested structs", () => {
        const nestedStruct: DataType = {
            outer: {
                scalar: "f32",
                inner: {
                    vector: "vec4",
                    matrix: "mat2x2"
                }
            }
        };

        // Calculate size with proper alignment
        const size = sizeOf(nestedStruct);
        expect(size).toBe(48); // Verify exact size based on alignment rules
    });

    test("should track field offsets for structs", () => {
        const structType: DataType = {
            scalar: "f32",
            vector: "vec3",
            matrix: "mat2x2"
        };

        const fieldOffsets = new Map<string, number>();
        const size = sizeOf(structType, fieldOffsets);

        expect(fieldOffsets.get("scalar")).toBe(0);
        expect(fieldOffsets.get("vector")).toBe(16); // Aligned to 16-byte boundary
        expect(fieldOffsets.get("matrix")).toBe(32); // After vec3, aligned to 16
        expect(size).toBe(48);
    });

    test("should throw for unknown types", () => {
        expect(() => sizeOf("unknown_type" as any)).toThrow();
    });
});
