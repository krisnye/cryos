import { Schema } from "@adobe/data/schema"
import { Camera } from "./camera/camera.js"

export type Viewport = {
    camera: Camera
    context: GPUCanvasContext
}

export const ViewportSchema = {
    default: null as unknown as Viewport,
} as const satisfies Schema;
