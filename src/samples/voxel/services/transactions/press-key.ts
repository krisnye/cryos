import { VoxelStore } from "../voxel-store.js";
import { KeyCode } from "../../types/key-code.js";

export const pressKey = (t: VoxelStore, key: KeyCode) => {
    t.resources.pressedKeys = { ...t.resources.pressedKeys, [key]: 0 };
}; 