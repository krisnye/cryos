import { Database } from "@adobe/data/ecs";
import { pointerInput } from "../../../plugins/pointer-input.js";
import { voxelPhysics } from "./voxel-physics.js";
import { Quat } from "@adobe/data/math";

export const helloPhysicsInput = Database.Plugin.create({
    systems: {
        hello_physics_input: {
            create: db => {
                return () => {
                    for (const [pointerId, pointerState] of Object.entries(db.store.resources.activePointers)) {
                        if (pointerState.frameCount === 0) {
                            db.store.archetypes.MovingVoxel.insert({
                                voxel: true,
                                position: [10, 10, -0.5],
                                color: [1, 0, 0, 1],
                                scale: [1, 1, 1],
                                rotation: Quat.identity,
                                velocity: [2, 1, 0],
                                mass: 1
                            });
                        }
                    }
                };
            }
        },
    },
    extends: Database.Plugin.combine(pointerInput, voxelPhysics),
});

