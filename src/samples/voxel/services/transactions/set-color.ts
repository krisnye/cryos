import { VoxelStore } from "../voxel-store.js";
import { Vec4 } from "math/index.js";

export const setColor = (t: VoxelStore, { id, color }: { id: number, color: Vec4 }) => {
    t.update(id, { color });
}; 