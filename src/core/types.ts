import { Color } from "../math/Color.js"
import { Matrix4 } from "../math/Matrix4.js"
import { Vector2 } from "../math/Vector2.js"
import { Vector3 } from "../math/Vector3.js"
import { Vector4 } from "../math/Vector4.js"

export type StringKeyOf<T extends object> = Extract<keyof T, string>

export type WGSLScalarType = "bool" | "i32" | "u32" | "f32" | "f16"
export type WGSLVectorType =
    | "mat2x2" | "mat2x3" | "mat2x4"
    | "mat3x2" | "mat3x3" | "mat3x4"
    | "mat4x2" | "mat4x3" | "mat4x4"
    | "vec2" | "vec3" | "vec4" | "color"
export type WGSLType = WGSLScalarType | WGSLVectorType
export type GPUVertexAttributeNamed = GPUVertexAttribute & { name: string }
export type GPUVertexBufferLayoutNamed = GPUVertexBufferLayout & { attributes: GPUVertexAttributeNamed[] }

export type WGSLToCPUType<W extends WGSLType> =
    W extends "bool" ? boolean :
    W extends WGSLScalarType ? number :
    W extends "vec2" ? Vector2 :
    W extends "vec3" ? Vector3 :
    W extends "color" ? Color :     //  not a real WGSLType, maps to vec4
    W extends "vec4" ? Vector4 :
    W extends "mat2x2" ? [number, number, number, number] :
    W extends "mat2x3" | "mat3x2" ? [number, number, number, number, number, number] :
    W extends "mat2x4" | "mat4x2" ? [number, number, number, number, number, number, number, number] :
    W extends "mat3x4" | "mat4x3" ? [number, number, number, number, number, number, number, number, number, number, number, number] :
    W extends "mat4x4" ? Matrix4 :
    never

export interface GPUEncoderContext {
    command: GPUCommandEncoder
    renderPass: GPURenderPassEncoder
}

export interface GPURenderPipelineProperties {
    layout?: GPUBindGroupLayoutEntry[][]
    vertexInput: GPUVertexBufferLayoutNamed
    shader: string
    vertexMain?: string
    fragmentMain?: string
}

export type GPURenderPipelineAndMeta = GPURenderPipeline & {
    descriptor: GPURenderPipelineDescriptor
    properties: GPURenderPipelineProperties
}

export interface GPUContext {
    canvas: HTMLCanvasElement
    device: GPUDevice
    canvasContext: GPUCanvasContext
    depthTexture: GPUTexture
}

export type UniformValues<Bindings extends Record<string, UniformType>> = {
    readonly [K in StringKeyOf<Bindings>]: WGSLToCPUType<Bindings[K]>
}

/**
 * We only support f32 or vector/matrix of f32 as uniform inputs.
 */
export type UniformType = WGSLVectorType | "f32"
export type UniformBindings = Record<string, UniformType>
