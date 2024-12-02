////////////////////////////////////////////////////////////////////////////////
// Resource Types
////////////////////////////////////////////////////////////////////////////////

import { DataType, MatrixType, ScalarType, VectorType } from "./data-types.js";

export interface Resource {
  destroy(): void;
}

export interface Buffer<T extends DataType> extends Resource {
  readonly size: number;
}

export type TextureType = "texture_2d" | "texture_3d" | "texture_cube";
export type SamplerType = "sampler" | "sampler_comparison";
export type UniformType = ScalarType | VectorType | MatrixType;
export type StorageType = ScalarType | VectorType | MatrixType;
export type ResourceType = UniformType | StorageType | TextureType | SamplerType;

export interface StorageBuffer<T> {
}

type VertexScalarType = "i32" | "u32" | "f32";
export type VertexType = VertexScalarType | VectorType;

export type VertexAttributes = { [key: string]: VertexType }

export interface VertexBuffer<A extends VertexAttributes> extends GPUBuffer {
}
