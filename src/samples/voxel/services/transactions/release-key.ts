import { VoxelStore } from "../voxel-store.js";
import { KeyCode } from "../../types/key-code.js";

export const releaseKey = (t: VoxelStore, key: KeyCode) => {
    const copy = { ...t.resources.pressedKeys };
    delete (copy as Partial<Record<KeyCode, { frames: number, repeat: number, lastRepeatCount: number }>>)[key];
    t.resources.pressedKeys = copy;
}; 