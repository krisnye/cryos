import { ResourceType } from "../types/resource-types.js";


export function toWGSLType(type: ResourceType): string {
    // Handle array types (tuples)
    if (Array.isArray(type)) {
        const [elementType, count] = type;
        return `array<${toWGSLType(elementType)}, ${count}>`;
    }

    // Handle struct types (objects)
    if (typeof type === 'object') {
        const fields = Object.entries(type)
            .map(([name, fieldType]) => `    ${name}: ${toWGSLType(fieldType as ResourceType)}`)
            .join(',\n');
        return `struct {\n${fields}\n}`;
    }

    // Handle primitive types with proper WGSL syntax
    switch (type) {
        // Vector types need <f32>
        case "vec2":
            return "vec2<f32>";
        case "vec3":
            return "vec3<f32>";
        case "vec4":
            return "vec4<f32>";

        // Matrix types need <f32>
        case "mat2x2":
            return "mat2x2<f32>";
        case "mat3x3":
            return "mat3x3<f32>";
        case "mat4x4":
            return "mat4x4<f32>";
        case "mat2x3":
            return "mat2x3<f32>";
        case "mat2x4":
            return "mat2x4<f32>";
        case "mat3x2":
            return "mat3x2<f32>";
        case "mat3x4":
            return "mat3x4<f32>";
        case "mat4x2":
            return "mat4x2<f32>";
        case "mat4x3":
            return "mat4x3<f32>";
        case "texture_2d":
            return "texture_2d<f32>";
        case "texture_3d":
            return "texture_3d<f32>";
        case "texture_cube":
            return "texture_cube<f32>";

        default:
            return type;
    }
}
