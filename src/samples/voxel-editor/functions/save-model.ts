import { VoxelEditorStore } from "../voxel-editor-store.js";
import { modelsToVolume } from "../functions/models-to-volume.js";
import { serializeVoxelModel } from "../functions/serialize-voxel-model.js";
import { saveToFile, FileHandle } from "../functions/file-system-access.js";

/**
 * Transaction to save the current voxel model to a file.
 * Converts Model entities to Volume, serializes, and writes to disk.
 * 
 * @param store - The voxel editor store
 * @param fileHandle - Optional existing file handle for quick save
 * @returns File handle if successful, null if user cancelled
 */
export const saveModel = async (
    store: VoxelEditorStore,
    fileHandle?: FileHandle
): Promise<FileHandle | null> => {
    // Convert Model entities to VoxelModel (includes workspace size and offset)
    const model = modelsToVolume(store);
    
    // Serialize to JSON string
    const jsonString = await serializeVoxelModel(model);
    
    // Write to file
    const handle = await saveToFile(jsonString, fileHandle);
    
    // Update state if save was successful
    if (handle) {
        store.resources.currentFile = handle;
        store.resources.isDirty = false;
    }
    
    return handle;
};

