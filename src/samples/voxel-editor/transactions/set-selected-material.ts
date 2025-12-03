import { MaterialIndex } from "physics/material.js";
import { VoxelEditorStore } from "../voxel-editor-store.js";

export const setSelectedMaterial = (t: VoxelEditorStore, material: MaterialIndex) => {
    t.resources.selectedMaterial = material;
};

