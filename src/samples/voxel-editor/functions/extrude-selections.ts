import { AabbFace, Quat, Vec3, Vec4 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { setSelectedVoxelFace } from "./set-selected-voxel-face.js";
import { expandModelSize } from "../transactions/expand-model-size.js";
import { getEntityByPosition } from "./get-entity-by-position.js";

export const extrudeSelections = (
    t: VoxelEditorStore,
    { color, scale = [1, 1, 1] }: { color: Vec4; scale?: Vec3 }
): void => {
    // Collect all selected faces first to avoid mutating while iterating
    const selectedFaces: Array<{ position: Vec3; face: AabbFace }> = [];
    
    for (const table of t.queryArchetypes(t.archetypes.SelectedVoxel.components)) {
        for (let i = 0; i < table.rowCount; i++) {
            const position = table.columns.position.get(i);
            const selectedFacesFlags = table.columns.selectedFaces.get(i);
            
            for (const face of AabbFace.getFaces(selectedFacesFlags)) {
                selectedFaces.push({ position, face });
            }
        }
    }
    
    // Process each selected face
    for (const { position, face } of selectedFaces) {
        // Step one unit in the face normal direction
        const normal = AabbFace.getNormal(face);
        const extrudedPosition: Vec3 = [
            position[0] + normal[0],
            position[1] + normal[1],
            position[2] + normal[2],
        ];
        
        // Check if there's already a Model or Wall at the target position
        const existingModel = getEntityByPosition(t, extrudedPosition, t.archetypes.Model.components);
        const existingWall = getEntityByPosition(t, extrudedPosition, t.archetypes.Wall.components);
        
        // Only create a new Model voxel if the position is not occupied
        if (!existingModel && !existingWall) {
            t.archetypes.Model.insert({
                model: true,
                pickable: true,
                position: extrudedPosition,
                color,
                scale,
                rotation: Quat.identity,
            });
        }
        
        // Clear the current face selection
        setSelectedVoxelFace(t, { position, face, selected: false });
        
        // Select the same face on the extruded voxel (continuing in the same direction)
        setSelectedVoxelFace(t, { position: extrudedPosition, face, selected: true });
    }
    
    // Expand model size to accommodate the new voxels
    expandModelSize(t);
};

