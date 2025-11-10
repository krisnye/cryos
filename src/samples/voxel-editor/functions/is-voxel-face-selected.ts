import { AabbFace, Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { getSelectedVoxelByPosition } from "./get-selected-voxel-by-position.js";

export const isVoxelFaceSelected = (
    t: VoxelEditorStore,
    { position, face }: { position: Vec3; face: AabbFace }
): boolean => {
    const selectedVoxelId = getSelectedVoxelByPosition(t, position);
    const selectedVoxel = selectedVoxelId ? t.read(selectedVoxelId, t.archetypes.SelectedVoxel) : null;
    return ((selectedVoxel?.selectedFaces ?? AabbFace.NONE) & face) !== 0;
};

