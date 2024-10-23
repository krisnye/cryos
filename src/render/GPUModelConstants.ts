import { createVertexBufferLayoutNamed } from "../core/functions.js"
import type { UniformBindings } from "../core/types.js"

export const CAMERA_BINDINGS = { viewProjection: "mat4x4", position: "vec3", } satisfies UniformBindings
export const TRANSFORM_BINDINGS = { modelMatrix: "mat4x4" } satisfies UniformBindings

export const CAMERA_BINDGROUP_ENTRY_LAYOUT = { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry
export const TRANSFORM_BINDGROUP_ENTRY_LAYOUT = { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry

export const CAMERA_TRANSFORM_BINDGROUP_LAYOUT = [
    CAMERA_BINDGROUP_ENTRY_LAYOUT,
    TRANSFORM_BINDGROUP_ENTRY_LAYOUT
] satisfies GPUBindGroupLayoutEntry[]

export const MATERIAL_BINDGROUP_LAYOUT = [
    { binding: 0, sampler: { "type": "filtering" }, visibility: GPUShaderStage.FRAGMENT },
    { binding: 1, texture: { sampleType: "float", viewDimension: "2d" }, visibility: GPUShaderStage.FRAGMENT },
] satisfies GPUBindGroupLayoutEntry[]

export const GPU_MODEL_BINDGROUP_LAYOUTS = [
    CAMERA_TRANSFORM_BINDGROUP_LAYOUT,
    MATERIAL_BINDGROUP_LAYOUT
] satisfies GPUBindGroupLayoutEntry[][]

export const CAMERA_TRANSFORM_BINDGROUP_INDEX = GPU_MODEL_BINDGROUP_LAYOUTS.indexOf(CAMERA_TRANSFORM_BINDGROUP_LAYOUT)
export const MATERIAL_BINDGROUP_INDEX = GPU_MODEL_BINDGROUP_LAYOUTS.indexOf(MATERIAL_BINDGROUP_LAYOUT)

//  we should be able to create these definitions using a more concise format.
export const GPU_MODEL_VERTEX_FORMAT = {
    slots: {
        position: 0,
        normal: 1,
        texcoords: 2,
    } as const,
    layout: createVertexBufferLayoutNamed({
        position: "float32x4",
        normal: "float32x3",
        texcoords: "float32x2",
    })
} as const