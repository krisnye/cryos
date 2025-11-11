import { Entity } from "@adobe/data/ecs";
import { GraphicsStore } from "../graphics-store.js";

export const updateViewportSize = (
    t: GraphicsStore,
    params: {
        viewportId: Entity;
        width: number;
        height: number;
        depthTexture: GPUTexture;
    }
) => {
    const viewport = t.read(params.viewportId);
    if (!viewport) return;

    t.update(params.viewportId, {
        camera: {
            ...viewport.camera,
            aspect: params.width / params.height,
        },
        depthTexture: params.depthTexture,
    });
};

