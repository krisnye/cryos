import { UniformBindings, UniformValues } from "./types.js"


export const cameraBindings = {
    viewProjection: "mat4x4",
    position: "vec4",
} as const satisfies UniformBindings

export type CameraBindings = typeof cameraBindings

export type Camera = UniformValues<CameraBindings>
