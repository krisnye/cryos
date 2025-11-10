import { Vec2 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Entity } from "@adobe/data/ecs";
import { pickVoxelFace } from "../functions/pick-voxel-face.js";
import { isVoxelFaceSelected } from "../functions/is-voxel-face-selected.js";
import { toggleSelectedVoxelFace } from "../functions/toggle-selected-voxel-face.js";

export const pointerMove = (t: VoxelEditorStore, { viewportPosition, viewportId, pointerId }: { viewportPosition: Vec2, viewportId: Entity, pointerId: number }) => {
    const pointerDown = t.resources.pointerDown[pointerId];
    if (!pointerDown) {
        return;
    }
    const picked = pickVoxelFace(t, { viewportPosition, viewportId });
    if (!picked) {
        return;
    }
    const { position, face } = picked;
    const isFaceSelected = isVoxelFaceSelected(t, { position, face });
    const shouldBeSelected = pointerDown.select;
    
    // Only toggle if the current state doesn't match the desired state
    if (isFaceSelected !== shouldBeSelected) {
        toggleSelectedVoxelFace(t, { position, face });
    }
}