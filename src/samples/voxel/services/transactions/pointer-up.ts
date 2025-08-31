import { VoxelStore } from "../voxel-store.js";

export const pointerUp = (t: VoxelStore, { pointerId }: { pointerId: number }) => {
    // Remove the pointer state for this pointer
    const { [pointerId]: removed, ...remaining } = t.resources.pointerState;
    t.resources.pointerState = remaining;
    
    // Clear drag mode if no more active pointers
    if (Object.keys(remaining).length === 0) {
        t.resources.dragMode = null;
    }
}; 