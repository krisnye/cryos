import { Entity } from "@adobe/data/ecs";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Vec3 } from "@adobe/data/math";
import { getEntityByPosition } from "./get-entity-by-position.js";

export const getSelectedVoxelByPosition = (t: VoxelEditorStore, position: Vec3): Entity | null => {
    return getEntityByPosition(t, position, t.archetypes.SelectedVoxel.components);
};