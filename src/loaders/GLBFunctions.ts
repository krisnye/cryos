import { GLTFComponentType, GLTFRenderMode, GLTFType } from "./GLTFTypes.js";

export function gltfRenderModeToGPUPrimitiveTopology(mode: GLTFRenderMode): GPUPrimitiveTopology {
    switch (mode) {
        case GLTFRenderMode.TRIANGLES:
            return "triangle-list"
        case GLTFRenderMode.TRIANGLE_STRIP:
            return "triangle-strip"
        default:
            throw new Error(`Not supported mode: ${mode}`)
    }
}

export function gltfTypeNumComponents(type: GLTFType) {
    switch (type) {
        case GLTFType.SCALAR:
            return 1;
        case GLTFType.VEC2:
            return 2;
        case GLTFType.VEC3:
            return 3;
        case GLTFType.VEC4:
        case GLTFType.MAT2:
            return 4;
        case GLTFType.MAT3:
            return 9;
        case GLTFType.MAT4:
            return 16;
        default:
            throw Error(`Invalid glTF Type ${type}`);
    }
}

export function gltfComponentSize(type: GLTFComponentType) {
    switch (type) {
        case GLTFComponentType.BYTE:
        case GLTFComponentType.UNSIGNED_BYTE:
            return 1
        case GLTFComponentType.SHORT:
        case GLTFComponentType.UNSIGNED_SHORT:
            return 2
        case GLTFComponentType.INT:
        case GLTFComponentType.UNSIGNED_INT:
        case GLTFComponentType.FLOAT:
            return 4
        case GLTFComponentType.DOUBLE:
            return 8
        default:
            throw Error("Unrecognized GLTF Component Type?");
    }
}

export function gltfTypeSize(componentType: GLTFComponentType, type: GLTFType) {
    return gltfTypeNumComponents(type) * gltfComponentSize(componentType);
}

function gltfTypeToGPUType(type: GLTFComponentType): string {
    switch (type) {
        case GLTFComponentType.BYTE:
            return "sint8";
        case GLTFComponentType.UNSIGNED_BYTE:
            return "uint8";
        case GLTFComponentType.SHORT:
            return "sint16";
        case GLTFComponentType.UNSIGNED_SHORT:
            return "uint16";
        case GLTFComponentType.INT:
            return "int32";
        case GLTFComponentType.UNSIGNED_INT:
            return "uint32";
        case GLTFComponentType.FLOAT:
            return "float32";
        default:
            throw Error(`Unrecognized or unsupported glTF type ${type}`);
    }
}

// Note: only returns non-normalized type names,
// so byte/ubyte = sint8/uint8, not snorm8/unorm8, same for ushort
export function gltfVertexType(componentType: GLTFComponentType, type: GLTFType): GPUVertexFormat {
    let typeStr = gltfTypeToGPUType(componentType);
    let count = gltfTypeNumComponents(type)
    return (count === 1 ? typeStr : `${typeStr}x${count}`) as GPUVertexFormat
}