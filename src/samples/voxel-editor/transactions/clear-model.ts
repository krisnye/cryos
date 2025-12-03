import { VoxelEditorStore } from "../voxel-editor-store.js";

/**
 * Clears all Model entities from the store.
 */
export const clearModel = (store: VoxelEditorStore): void => {
    for (const entity of store.select(store.archetypes.Model.components)) {
        store.delete(entity);
    }
};

