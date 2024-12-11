import { DataType } from "../types/data-types.js";
import { align } from "./align.js";

/**
 * Determines the base alignment requirements for WGSL data types.
 * Rules based on:
 * @see https://www.w3.org/TR/WGSL/#alignment-and-size
 *
 * Key rules:
 * - Scalar types (i32, f32, etc): 4-byte aligned (except f16: 2-byte)
 * - vec2: 8-byte aligned
 * - vec3/vec4: 16-byte aligned
 * - Matrices: 16-byte aligned
 * - Arrays: Element alignment rounded up to 16-byte boundary
 * - Structs: Aligned to largest member alignment
 */

export function getBaseAlignment(type: DataType): number {
    // Handle array types (tuples)
    if (Array.isArray(type)) {
        // Array alignment is same as element alignment, rounded up to 16
        return Math.min(16, align(getBaseAlignment(type[0]), 16));
    }

    // Handle struct types (objects)
    if (typeof type === 'object') {
        // Struct alignment is largest member alignment
        let maxAlignment = 0;
        for (const field of Object.values(type) as DataType[]) {
            maxAlignment = Math.max(maxAlignment, getBaseAlignment(field));
        }
        return maxAlignment;
    }

    // Handle primitive types
    switch (type) {
        // Scalar types are 4-byte aligned
        case "bool":
        case "i32":
        case "u32":
        case "f32":
            return 4;
        // Vector types
        case "vec2":
            return 8; // 2 x f32, 8-byte aligned
        case "vec3":
        case "vec4":
            return 16; // 3/4 x f32, 16-byte aligned


        // Matrix types (always 16-byte aligned)
        case "mat2x2":
        case "mat3x3":
        case "mat4x4":
            return 16;

        default:
            throw new Error(`Unknown type: ${type}`);
    }
}
