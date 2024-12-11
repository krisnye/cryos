import { VertexType } from "../types/resource-types.js";

export function toGPUVertexFormat(type: VertexType): GPUVertexFormat {
    switch (type) {
        // Scalar formats
        case "i32": return "sint32";
        case "u32": return "uint32";
        case "f32": return "float32";
        // Vector formats
        case "vec2": return "float32x2";
        case "vec3": return "float32x3";
        case "vec4": return "float32x4";
    }
}
