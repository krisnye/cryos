import { VoxelStore } from "../voxel-store.js";
import { getFromSpatialMap } from "samples/voxel/types/spatial-map/index.js";
import { SELECTED_OFFSET } from "../../types/flags.js";
import { Entity } from "@adobe/data/ecs";

/**
 * Toggles the selection of the hovered face on the particle at hoverPosition
 * Uses the spatial map to find the particle and toggles the selection flag for the specific face
 */
export const toggleSelection = (store: VoxelStore) => {
    const { hoverPosition, hoverFace, mapColumns } = store.resources;
    
    // Skip if no valid hover position
    if (hoverPosition[0] === -1000 && hoverPosition[1] === -1000 && hoverPosition[2] === -1000) {
        return;
    }
    
    // Find the particle at the hover position using the spatial map
    const entityData = getFromSpatialMap(mapColumns, hoverPosition);
    
    if (!entityData) {
        return; // No particle at this position
    }
    
    // Handle both single entity and array of entities
    const entities = Array.isArray(entityData) ? entityData : [entityData];
    
    // For now, we'll toggle the first entity found (could be enhanced to handle multiple entities)
    const entity = entities[0];
    if (entity === undefined) {
        return;
    }
    
    // Get current flags for the entity
    const currentFlags = store.get(entity, "flags") ?? 0;
    
    // Calculate the face selection mask
    const faceSelectionMask = 1 << (hoverFace + SELECTED_OFFSET);
    
    // Toggle the selection for this face
    const newFlags = currentFlags ^ faceSelectionMask;
    
    // Update the entity with new flags
    store.update(entity, { flags: newFlags });
    
    console.log(`Toggled selection for face ${hoverFace} on entity ${entity}. Flags: ${currentFlags} -> ${newFlags}`);
}; 