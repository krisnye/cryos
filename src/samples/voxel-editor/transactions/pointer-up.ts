import { Vec2 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Entity } from "@adobe/data/ecs";

export const pointerUp = (t: VoxelEditorStore, { viewportPosition, viewportId, pointerId }: { viewportPosition: Vec2, viewportId: Entity, pointerId: number }) => {
    const pointerDown = t.resources.pointerDown[pointerId];
    if (pointerDown) {
        // Coalesce with the current drag operation using its unique drag ID
        t.undoable = { coalesce: { action: "area-selection", dragId: pointerDown.dragId } };
    }
    
    t.resources.pointerDown[pointerId] = undefined;
}