import { Vec2 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Entity } from "@adobe/data/ecs";
import { pickVoxelFace } from "../functions/pick-voxel-face.js";
import { toggleSelectedVoxelFace } from "../functions/toggle-selected-voxel-face.js";

export const pointerDown = (t: VoxelEditorStore, { viewportPosition, viewportId, pointerId }: { viewportPosition: Vec2, viewportId: Entity, pointerId: number }) => {
    // Generate a unique drag ID for this drag operation
    const dragId = t.resources.nextDragId++;
    
    // Start a new undoable transaction for area selection with a unique coalesce key per drag
    t.undoable = { coalesce: { action: "area-selection", dragId } };
    
    const picked = pickVoxelFace(t, { viewportPosition, viewportId });
    if (!picked) {
        return;
    }
    const { position, face } = picked;
    const { selected } = toggleSelectedVoxelFace(t, { position, face });
    // track the pointer down information including the drag ID
    t.resources.pointerDown[pointerId] = { position, face, select: selected, dragId };
}