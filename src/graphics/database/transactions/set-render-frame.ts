import { Frame } from "graphics/frame.js";
import { GraphicsStore } from "../graphics-store.js";

export const setRenderFrame = (t: GraphicsStore, frame: Frame) => {
    t.resources.renderFrame = frame;
};
