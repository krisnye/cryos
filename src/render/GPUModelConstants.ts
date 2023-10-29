import { createVertexBufferLayoutNamed } from "../core/functions.js"
import type { UniformBindings, UniformValues } from "../core/types.js"
import { Color } from "../math/Color.js"
import { Matrix4 } from "../math/Matrix4.js"
import { Vector3 } from "../math/Vector3.js"
import { Vector4 } from "../math/Vector4.js"

export const CAMERA_BINDINGS = {
    ambientLightColor: "color",
    viewProjectionMatrix: "mat4x4",
    cameraPosition: "vec4",
    directionalLightColor: "color",
    directionalLightDirection: "vec4",
} satisfies UniformBindings
export const CAMERA_BINDGROUP_ENTRY_LAYOUT = { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry
export const CAMERA_DEFAULT_VALUES = {
    viewProjectionMatrix: Matrix4.identity,
    cameraPosition: Vector4.zero,
    ambientLightColor: new Color(0.2, 0.4, 0.6, 0.8),
    directionalLightColor: Color.white,
    directionalLightDirection: new Vector4(1, 2, 4, 1).normalize(),
} satisfies UniformValues<typeof CAMERA_BINDINGS>

export const TRANSFORM_BINDINGS = { modelMatrix: "mat4x4" } satisfies UniformBindings
export const TRANSFORM_BINDGROUP_ENTRY_LAYOUT = { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry

export const LIGHT_BINDINGS = {
    ambientLightColor: "color",
    directionalLightColor: "color",
    directionalLightDirection: "vec4",
} satisfies UniformBindings
export const LIGHT_BINDGROUP_ENTRY_LAYOUT = { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry
// export const LIGHT_BINDGROUP_LAYOUT = [LIGHT_BINDGROUP_ENTRY_LAYOUT]

export const SCENE_BINDGROUP_LAYOUT = [
    CAMERA_BINDGROUP_ENTRY_LAYOUT,
    TRANSFORM_BINDGROUP_ENTRY_LAYOUT,
    // LIGHT_BINDGROUP_ENTRY_LAYOUT,
] satisfies GPUBindGroupLayoutEntry[]

export const MATERIAL_BINDGROUP_LAYOUT = [
    { binding: 0, sampler: { "type": "filtering" }, visibility: GPUShaderStage.FRAGMENT },
    { binding: 1, texture: { sampleType: "float", viewDimension: "2d" }, visibility: GPUShaderStage.FRAGMENT },
] satisfies GPUBindGroupLayoutEntry[]

export const GPU_MODEL_BINDGROUP_LAYOUTS = [
    SCENE_BINDGROUP_LAYOUT,
    MATERIAL_BINDGROUP_LAYOUT,
] satisfies GPUBindGroupLayoutEntry[][]

export const CAMERA_TRANSFORM_BINDGROUP_INDEX = GPU_MODEL_BINDGROUP_LAYOUTS.indexOf(SCENE_BINDGROUP_LAYOUT)
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