import { Camera } from "graphics/index.js";
import { GraphicsStore } from "../graphics-store.js";
import { Vec4 } from "@adobe/data/math";
import { isContext } from "vm";

export const insertViewport = (t: GraphicsStore, viewport: { context: GPUCanvasContext, camera: Camera, depthTexture: GPUTexture, color: Vec4 }) => {
    return t.archetypes.Viewport.insert({
        ...viewport,
        sceneUniformsBuffer: null as unknown as GPUBuffer,
    });
};
