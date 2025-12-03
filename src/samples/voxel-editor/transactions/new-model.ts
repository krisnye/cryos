import { schema, VoxelEditorStore } from "../voxel-editor-store.js";
import { clearModel } from "./clear-model.js";
import { clearSelection } from "./clear-selection.js";

/**
 * Transaction to create a new model.
 * Clears all Model entities, selection, and resets to default model size.
 * 
 * @param store - The voxel editor store
 */
export const newModel = (store: VoxelEditorStore): void => {
    store.undoable = { coalesce: false };
    
    // Clear all models and selection
    clearModel(store);
    clearSelection(store);
    
    // Reset model size to default
    store.resources.modelSize = schema.resources.modelSize.default;
    
    // Clear file state
    store.resources.currentFile = null;
    store.resources.isDirty = false;
};

