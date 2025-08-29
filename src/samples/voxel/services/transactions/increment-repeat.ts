import { VoxelStore } from "../voxel-store.js";
import { KeyCode } from "../../types/key-code.js";

export const incrementRepeat = (t: VoxelStore, key: KeyCode) => {
    const currentState = t.resources.pressedKeys[key];
    if (currentState) {
        t.resources.pressedKeys = {
            ...t.resources.pressedKeys,
            [key]: {
                ...currentState,
                repeat: currentState.repeat + 1
            }
        };
    }
}; 