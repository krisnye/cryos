import { VoxelEditorStore } from "../voxel-editor-store.js";

/**
 * Transaction to mark the model as having unsaved changes.
 * Should be called whenever Model entities are created, modified, or deleted.
 * 
 * @param store - The voxel editor store
 */
export const markDirty = (store: VoxelEditorStore): void => {
    store.resources.isDirty = true;
};

