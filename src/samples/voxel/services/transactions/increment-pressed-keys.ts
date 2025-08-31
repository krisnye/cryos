import { VoxelStore } from "../voxel-store.js";

export const incrementPressedKeys = (t: VoxelStore) => {
    t.resources.pressedKeys = Object.fromEntries(
        Object.entries(t.resources.pressedKeys).map(([key, state]) => [
            key, 
            { 
                ...(state as { frames: number, repeat: number, lastRepeatCount: number }), 
                frames: (state as { frames: number, repeat: number, lastRepeatCount: number }).frames + 1,
                lastRepeatCount: (state as { frames: number, repeat: number, lastRepeatCount: number }).repeat
            }
        ])
    );
}; 