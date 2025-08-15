import { VoxelStore } from "../voxel-store.js";
import { KeyCode } from "../../types/key-code.js";

export const releaseKey = (t: VoxelStore, key: KeyCode) => {
    const copy = { ...t.resources.pressedKeys };
    delete copy[key];
    t.resources.pressedKeys = copy;
}; 