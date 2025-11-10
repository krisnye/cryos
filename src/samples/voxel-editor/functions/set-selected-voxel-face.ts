
import { AabbFace, Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { getSelectedVoxelByPosition } from "./get-selected-voxel-by-position.js";

export const setSelectedVoxelFace = (t: VoxelEditorStore, { position, face, selected }: { position: Vec3, face: AabbFace, selected: boolean })
: void => {
    let selectedVoxelId = getSelectedVoxelByPosition(t, position);
    if (!selectedVoxelId) {
        selectedVoxelId = t.archetypes.SelectedVoxel.insert({
            selectedFaces: AabbFace.NONE,
            position,
        });
    }
    let selectedVoxel = t.read(selectedVoxelId, t.archetypes.SelectedVoxel)!;
    const newSelectedFaces = selected 
        ? selectedVoxel.selectedFaces | face 
        : selectedVoxel.selectedFaces & ~face;
    if (newSelectedFaces === AabbFace.NONE) {
        t.delete(selectedVoxelId);
    } else {
        t.update(selectedVoxelId, { selectedFaces: newSelectedFaces });
    }
};

