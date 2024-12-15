import { DataType } from "../types/data-types.js";
import { align } from "./align.js";
import { getBaseAlignment } from "./get-base-alignment.js";

/**
 * Calculates the size of a WGSL data type in bytes.
 * Follows WGSL alignment rules as specified in:
 * @see https://www.w3.org/TR/WGSL/#alignment-and-size
 */

export function sizeOf(type: DataType, fieldOffsetMap?: Map<string, number>): number {
    // Handle array types (tuples)
    if (Array.isArray(type)) {
        const [elementType, count] = type;
        const baseAlignment = getBaseAlignment(elementType);
        const elementSize = align(sizeOf(elementType), baseAlignment);
        return elementSize * count;
    }

    // Handle struct types (objects)
    if (typeof type === 'object') {
        let totalSize = 0;
        const structAlignment = getBaseAlignment(type);

        for (const name of Object.keys(type)) {
            const field = type[name] as DataType;
            const fieldAlignment = getBaseAlignment(field);
            
            // Align field to its required alignment
            totalSize = align(totalSize, fieldAlignment);
            
            if (fieldOffsetMap) {
                fieldOffsetMap.set(name, totalSize);
            }
            
            // Add field size
            totalSize += sizeOf(field);
        }

        // Round up total size to struct's alignment (which is its largest member alignment)
        return align(totalSize, structAlignment);
    }

    // Handle primitive types
    switch (type) {
        case "bool":
        case "i32":
        case "u32":
        case "f32":
            return 4;
        case "vec2":
            return 8;
        case "vec3":
            return 16;
        case "vec4":
        case "mat2x2":
            return 16;
        case "mat2x3":
        case "mat3x2":
            return 24;
        case "mat3x3":
            return 36;
        case "mat3x4":
        case "mat4x3":
            return 48;
        case "mat4x4":
            return 64;
        default:
            throw new Error(`Unknown type: ${type}`);
    }
}
