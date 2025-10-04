import { Camera } from "graphics/camera/camera.js";
import { GraphicsStore } from "../graphics-store.js";

export const updateCamera = (t: GraphicsStore, camera: Partial<Camera>) => {
    t.resources.camera = {
        ...t.resources.camera,
        ...camera
    };
};
