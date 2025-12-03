import { VoxelEditorStore } from "../voxel-editor-store.js";
import { deserializeVoxelModel } from "../functions/deserialize-voxel-model.js";
import { volumeToModels } from "../functions/volume-to-models.js";
import { loadFromFile, FileHandle } from "../functions/file-system-access.js";

/**
 * Transaction to load a voxel model from a file.
 * Clears existing Model entities and reconstructs from loaded data.
 * 
 * @param store - The voxel editor store
 * @returns File handle if successful, null if user cancelled
 * @throws Error if deserialization fails (preserves existing model)
 */
export const loadModel = async (
    store: VoxelEditorStore
): Promise<FileHandle | null> => {
    // Prompt user to select file and read contents
    const result = await loadFromFile();
    
    if (!result) {
        return null; // User cancelled
    }
    
    const { content, handle } = result;
    
    // Deserialize (this may throw if file is invalid)
    const model = await deserializeVoxelModel(content);
    
    // Only after successful deserialization do we modify the store
    // This ensures we don't corrupt the existing model on load failure
    
    // Clear all existing Model entities
    const entitiesToDelete = [];
    for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
        for (let i = 0; i < table.rowCount; i++) {
            entitiesToDelete.push(table.columns.id.get(i));
        }
    }
    for (const entity of entitiesToDelete) {
        store.delete(entity);
    }
    
    // Update model size from loaded data
    store.resources.modelSize = model.modelSize;
    
    // Reconstruct Model entities from volume
    // Use offset to place the packed volume correctly in workspace
    volumeToModels(store, model.material, model.offset);
    
    // Update state after successful load
    store.resources.currentFile = handle;
    store.resources.isDirty = false;
    
    return handle;
};

