import { Frame } from "graphics/frame.js";
import { GraphicsStore } from "../graphics-store.js";

export const setUpdateFrame = (t: GraphicsStore, frame: Frame) => {
    t.resources.updateFrame = frame;
};
