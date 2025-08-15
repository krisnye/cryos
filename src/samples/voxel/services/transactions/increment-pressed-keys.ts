import { VoxelStore } from "../voxel-store.js";

export const incrementPressedKeys = (t: VoxelStore) => {
    t.resources.pressedKeys = Object.fromEntries(
        Object.entries(t.resources.pressedKeys).map(([key, value]) => [key, value + 1])
    );
}; 