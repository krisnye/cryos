import { VoxelStore } from "../voxel-store.js";
import { Vec2 } from "math/index.js";

export const setMousePosition = (t: VoxelStore, position: Vec2) => {
    t.resources.mousePosition = position;
};
