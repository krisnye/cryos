
////////////////////////////////////////////////////////////////////////////////
// Declarative Data Types
////////////////////////////////////////////////////////////////////////////////

export type ScalarType = "bool" | "i32" | "u32" | "f32";
export type VectorType = "vec2" | "vec3" | "vec4";
export type MatrixType =
  | "mat2x2"
  | "mat2x3"
  | "mat2x4"
  | "mat3x2"
  | "mat3x3"
  | "mat3x4"
  | "mat4x2"
  | "mat4x3"
  | "mat4x4";
export type TupleType = readonly [DataType, number];
export type StructType = { [field: string]: DataType };
export type DataType = ScalarType | VectorType | MatrixType | StructType | TupleType;

////////////////////////////////////////////////////////////////////////////////
// Typescript Data Types
////////////////////////////////////////////////////////////////////////////////

export type I32 = number
export type U32 = number
export type F32 = number
export type F16 = number
export type Mat2x2 = readonly [F32, F32, F32, F32]
export type Mat2x3 = readonly [F32, F32, F32, F32, F32, F32]
export type Mat2x4 = readonly [F32, F32, F32, F32, F32, F32, F32, F32]
export type Mat3x2 = readonly [F32, F32, F32, F32, F32, F32]
export type Mat3x3 = readonly [F32, F32, F32, F32, F32, F32, F32, F32, F32]
export type Mat3x4 = readonly [F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32]
export type Mat4x2 = readonly [F32, F32, F32, F32, F32, F32, F32, F32]
export type Mat4x3 = readonly [F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32]
export type Mat4x4 = readonly [F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32, F32]
export type Vec2 = readonly [F32, F32]
export type Vec3 = readonly [F32, F32, F32]
export type Vec4 = readonly [F32, F32, F32, F32]

////////////////////////////////////////////////////////////////////////////////
// Conversion from Declarative Data Types to Typescript Types
////////////////////////////////////////////////////////////////////////////////

export type FromDataType<T> =
    T extends "bool" ? boolean :
    T extends "i32" ? I32 :
    T extends "u32" ? U32 :
    T extends "f32" ? F32 :
    T extends "f16" ? F16 :
    T extends "mat2x2" ? Mat2x2 :
    T extends "mat2x3" ? Mat2x3 :
    T extends "mat2x4" ? Mat2x4 :
    T extends "mat3x2" ? Mat3x2 :
    T extends "mat3x3" ? Mat3x3 :
    T extends "mat3x4" ? Mat3x4 :
    T extends "mat4x2" ? Mat4x2 :
    T extends "mat4x3" ? Mat4x3 :
    T extends "mat4x4" ? Mat4x4 :
    T extends "vec2" ? Vec2 :
    T extends "vec3" ? Vec3 :
    T extends "vec4" ? Vec4 :
    T extends StructType ? { [K in keyof T]: FromDataType<T[K]> } :
    T extends TupleType ? ArrayLike<FromDataType<T[0]>> :
    never;
