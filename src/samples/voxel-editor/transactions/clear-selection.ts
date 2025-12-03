import { VoxelEditorStore } from "../voxel-editor-store.js";

/**
 * Clears all selected voxels by deleting all SelectedVoxel entities.
 */
export const clearSelection = (t: VoxelEditorStore) => {
    for (const entity of t.select(t.archetypes.SelectedVoxel.components)) {
        t.delete(entity);
    }
};

