/**
 * Browser File System Access API wrapper functions.
 * Provides save and load functionality for voxel model files.
 */

export type FileHandle = FileSystemFileHandle;

export type LoadResult = {
    content: string;
    handle: FileHandle;
};

const FILE_OPTIONS = {
    types: [{
        description: "JSON Files",
        accept: { 
            "application/json": [".json"]
        }
    }],
    excludeAcceptAllOption: true
} as const;

/**
 * Saves content to a file using File System Access API.
 * 
 * @param content - String content to write to file
 * @param handle - Optional file handle for quick save (skips picker)
 * @returns File handle if successful, null if user cancelled
 */
export const saveToFile = async (
    content: string,
    handle?: FileHandle
): Promise<FileHandle | null> => {
    try {
        // If no handle provided, prompt user for save location
        if (!handle) {
            handle = await window.showSaveFilePicker({
                ...FILE_OPTIONS,
                suggestedName: "model.json"
            });
        }
        
        // Create writable stream and write content
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        
        return handle;
    } catch (error) {
        // User cancelled or permission denied
        console.warn("Save cancelled or failed:", error);
        return null;
    }
};

/**
 * Loads content from a file using File System Access API.
 * 
 * @returns Load result with content and handle, or null if user cancelled
 */
export const loadFromFile = async (): Promise<LoadResult | null> => {
    try {
        // Prompt user to select file
        const [handle] = await window.showOpenFilePicker({
            ...FILE_OPTIONS,
            multiple: false
        });
        
        // Get file and read contents
        // Browser will automatically request permission if needed
        const file = await handle.getFile();
        const content = await file.text();
        
        return { content, handle };
    } catch (error) {
        // User cancelled or permission denied
        console.warn("Load cancelled or failed:", error);
        return null;
    }
};

