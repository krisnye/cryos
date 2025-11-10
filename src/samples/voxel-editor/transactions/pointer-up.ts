import { Vec2 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Entity } from "@adobe/data/ecs";

export const pointerUp = (t: VoxelEditorStore, { viewportPosition, viewportId, pointerId }: { viewportPosition: Vec2, viewportId: Entity, pointerId: number }) => {
    t.resources.pointerDown[pointerId] = undefined;
}