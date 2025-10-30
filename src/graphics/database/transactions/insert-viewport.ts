import { Camera } from "graphics/index.js";
import { GraphicsStore } from "../graphics-store.js";
import { Vec4 } from "@adobe/data/math";

export const insertViewport = (t: GraphicsStore, viewport: { context: GPUCanvasContext, camera: Camera, depthTexture: GPUTexture, color: Vec4, cameraControlType?: Camera.ControlType }) => {
    return t.archetypes.Viewport.insert({
        ...viewport,
        cameraControlType: viewport.cameraControlType ?? "orbit",
        sceneUniformsBuffer: null as unknown as GPUBuffer,
    });
};
