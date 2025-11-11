import { AabbFace, Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { getEntityByPosition } from "./get-entity-by-position.js";
import { setSelectedVoxelFace } from "./set-selected-voxel-face.js";
import { expandModelSize } from "../transactions/expand-model-size.js";

export const intrudeSelections = (t: VoxelEditorStore): void => {
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
        // Find the model entity at this position
        const currentEntity = getEntityByPosition(
            t,
            position,
            t.archetypes.Model.components
        );
        
        // Delete if there's a model entity at this position
        if (currentEntity) {
            t.delete(currentEntity);
        }
        
        // Always clear the current face selection and move inward
        setSelectedVoxelFace(t, { position, face, selected: false });
        
        // Step one unit back (opposite direction of the face normal)
        const normal = AabbFace.getNormal(face);
        const previousPosition: Vec3 = [
            position[0] - normal[0],
            position[1] - normal[1],
            position[2] - normal[2],
        ];
        
        // Select the same face on the previous position (continuing to allow movement)
        setSelectedVoxelFace(t, { position: previousPosition, face, selected: true });
    }
    
    // Adjust model size (may shrink back to default if voxels were deleted)
    expandModelSize(t);
};

