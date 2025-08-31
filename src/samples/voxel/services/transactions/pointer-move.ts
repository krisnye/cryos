import { VoxelStore } from "../voxel-store.js";
import { pickParticle } from "../../functions/pick-particle.js";
import { Vec2 } from "math/index.js";
import { selectCurrent } from "./select-current.js";

export const pointerMove = (t: VoxelStore, { pointerId, position }: {
    pointerId: number;
    position: Vec2;
}) => {
    // Get or create pointer state
    const pointerState = t.resources.pointerState[pointerId];
    if (!pointerState) {
        // Create a new pointer state for hover tracking
        const pick = pickParticle(t, position);
        t.resources.pointerState = {
            ...t.resources.pointerState,
            [pointerId]: {
                position: position,
                entity: pick 
                    ? { id: pick.entity, flags: t.get(pick.entity, "flags") ?? 0 }
                    : null,
                face: pick ? pick.face : 0,
            }
        };
        return;
    }

    // Pick the entity at the current position
    const pick = pickParticle(t, position);
    
    // Update the current state
    t.resources.pointerState = {
        ...t.resources.pointerState,
        [pointerId]: {
            ...pointerState,
            position: position,
            entity: pick 
                ? { id: pick.entity, flags: t.get(pick.entity, "flags") ?? 0 }
                : null,
            face: pick ? pick.face : 0,
        }
    };
    
    // Select the current entity if we have a drag mode (any pointer is being dragged)
    if (t.resources.dragMode) {
        selectCurrent(t, { pointerId });
    }
}; 