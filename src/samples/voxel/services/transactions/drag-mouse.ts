import { VoxelStore } from "../voxel-store.js";
import { Vec2 } from "math/index.js";

export const dragMouse = (t: VoxelStore, { position }: { position: Vec2 }) => {
    console.log("drag mouse", position);
}; 