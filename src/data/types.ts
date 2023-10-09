import type { Struct } from "./Struct.js"
import type { typeDescriptors } from "./constants.js";

export type ValueType = Primitive | Struct
export type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array;
export type TypedArrayConstructor = new (length: number | ArrayBuffer) => TypedArray


export interface Primitive {
    min: number
    max: number
    bits: number
    arrayType?: TypedArrayConstructor
    gpuType?: string
}


export interface Types {
    u8: number
    u16: number
    u32: number
    i32: number
    f16: number
    f32: number
    f64: number
}

export type TypeId = keyof Types;

export type TypeDescriptor = Primitive;

type TypeDescriptors = typeof typeDescriptors

/**
 * Types with TypedArray classes for their elements.
 */
export type TypedArrayElementTypeId = "u8" | "u16" | "u32" | "i32" | "f32" | "f64";
/**
 * Valid GPU scalar data types.
 */
export type GPUTypeId = "u32" | "i32" | "f16" | "f32";
/**
 * GPUTypes which also have a valid TypedArray.
 */
export type TypedArrayElementGPUTypeId = TypedArrayElementTypeId & GPUTypeId;

export type ArrayType<T extends TypedArrayElementTypeId> = InstanceType<TypeDescriptors[T]["arrayType"]>;