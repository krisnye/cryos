import { GraphicsStore } from "../graphics-store.js";

export const setDevice = (t: GraphicsStore, device: GPUDevice) => {
    t.resources.device = device;
};
