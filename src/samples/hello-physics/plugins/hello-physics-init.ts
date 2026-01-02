import { Database } from "@adobe/data/ecs";
import { Quat } from "@adobe/data/math";
import { voxels } from "../../../plugins/voxels.js";
import { cameraControl } from "../../../plugins/camera-control.js";

export const helloPhysicsInit = Database.Plugin.create({
    systems: {
        hello_physics_init: {
            create: db => {
                db.transactions.createAxis();

                db.store.archetypes.Voxel.insert({
                    voxel: true,
                    position: [0, 0, -0.5],
                    color: [0.4, 0.26, 0.13, 1],
                    scale: [64, 64, 1],
                    rotation: Quat.identity
                });
                                        
                // Enable orbit camera control
                db.store.resources.cameraControlType = "orbit";
                // this is an init only system so it doesn't return a system function.
            }
        },
    },
    extends: Database.Plugin.combine(voxels, cameraControl),
});

