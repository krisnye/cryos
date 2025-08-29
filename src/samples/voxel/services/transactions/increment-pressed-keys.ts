import { VoxelStore } from "../voxel-store.js";

export const incrementPressedKeys = (t: VoxelStore) => {
    t.resources.pressedKeys = Object.fromEntries(
        Object.entries(t.resources.pressedKeys).map(([key, state]) => [
            key, 
            { 
                ...state, 
                frames: state.frames + 1,
                lastRepeatCount: state.repeat
            }
        ])
    );
}; 