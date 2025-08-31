import { VoxelStore } from "../voxel-store.js";
import { SELECTED_OFFSET } from "../../types/flags.js";

export const selectCurrent = (t: VoxelStore, { pointerId }: { pointerId: number }) => {
    const pointerState = t.resources.pointerState[pointerId];
    if (!pointerState) {
        return; // No pointer state for this pointer
    }

    const { entity: currentEntity, face: currentFace } = pointerState;
    const { dragMode } = t.resources;
    
    if (!currentEntity || !dragMode) {
        return; // No entity under current pointer position or no drag mode
    }

    // Get current flags for the entity
    const currentFlags = t.get(currentEntity.id, "flags") ?? 0;
    
    // Calculate the face selection mask for the specific face
    const faceSelectionMask = 1 << (SELECTED_OFFSET + currentFace);
    
    // Determine selection behavior based on drag mode
    let newFlags = currentFlags;
    
    if (dragMode === "unselect") {
        // Unselect: Remove this face from selection
        newFlags = currentFlags & ~faceSelectionMask;
    } else if (dragMode === "select") {
        // Select: Add this face to selection (don't clear others)
        newFlags = currentFlags | faceSelectionMask;
    }
    
    // Update the entity with new flags
    t.update(currentEntity.id, { flags: newFlags });
}; 