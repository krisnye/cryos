import { AabbFace, Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { getEntityByPosition } from "./get-entity-by-position.js";
import { setSelectedVoxelFace } from "./set-selected-voxel-face.js";

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
        // Find the pickable entity at this position
        const currentEntity = getEntityByPosition(
            t,
            position,
            t.archetypes.Pickable.components
        );
        
        // Delete if there's a pickable entity at this position, but NEVER delete walls
        if (currentEntity) {
            const isWall = t.get(currentEntity, "wall");
            if (!isWall) {
                t.delete(currentEntity);
            }
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
};

