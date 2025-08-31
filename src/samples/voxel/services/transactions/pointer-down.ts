import { VoxelStore, DragMode, PointerState } from "../voxel-store.js";
import { pickParticle } from "../../functions/pick-particle.js";
import { Vec2 } from "math/index.js";
import { SELECTED_OFFSET } from "../../types/flags.js";

export const pointerDown = (t: VoxelStore, { pointerId, position }: {
    pointerId: number;
    position: Vec2;
}) => {
    const pick = pickParticle(t, position);
    
    // Create the pointer state
    const pointerState: PointerState = {
        position: position,
        entity: pick 
            ? { id: pick.entity, flags: t.get(pick.entity, "flags") ?? 0 }
            : null,
        face: pick ? pick.face : 0,
    };

    // Store the pointer state first
    t.resources.pointerState = {
        ...t.resources.pointerState,
        [pointerId]: pointerState
    };

    // Only determine drag mode if this is the first pointer down
    const isFirstPointer = Object.keys(t.resources.pointerState).length === 1;
    
    if (isFirstPointer && pick) {
        // Determine drag mode based on current selection state
        const currentFlags = t.get(pick.entity, "flags") ?? 0;
        const faceSelectionMask = 1 << (SELECTED_OFFSET + pick.face);
        const isSelected = (currentFlags & faceSelectionMask) !== 0;
        
        const dragMode: DragMode = isSelected ? "unselect" : "select";
        t.resources.dragMode = dragMode;
    }
}; 