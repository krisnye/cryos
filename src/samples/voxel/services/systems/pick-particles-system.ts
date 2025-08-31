import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { pickParticle } from "../../functions/pick-particle.js";

export const pickParticlesSystem = ({ store, database }: MainService): System => {
    return {
        name: "pickParticlesSystem",
        phase: "preRender",
        run: () => {
            // Get the current pointer state (use any pointer for hover)
            const pointerStates = Object.values(store.resources.pointerState);
            const currentPointer = pointerStates[0]; // Just use the first pointer for hover
            
            if (currentPointer) {
                const picked = pickParticle(store, currentPointer.position);
                
                // Update hover state
                if (picked) {
                    store.resources.hoverPosition = picked.position;
                    store.resources.hoverFace = picked.face;
                } else {
                    store.resources.hoverPosition = [-1000, -1000, -1000];
                    store.resources.hoverFace = 10;
                }
            } else {
                // No pointers at all, clear hover state
                store.resources.hoverPosition = [-1000, -1000, -1000];
                store.resources.hoverFace = 10;
            }
        }
    } as const satisfies System;
};
