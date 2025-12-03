
import { AabbFace, Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { isVoxelFaceSelected } from "./is-voxel-face-selected.js";
import { setSelectedVoxelFace } from "./set-selected-voxel-face.js";

export const toggleSelectedVoxelFace = (t: VoxelEditorStore, { position, face }: { position: Vec3, face: AabbFace })
: { selected: boolean } => {
    const isFaceSelected = isVoxelFaceSelected(t, { position, face });
    setSelectedVoxelFace(t, { position, face, selected: !isFaceSelected });
    return { selected: !isFaceSelected };
}