import { Database } from "@adobe/data/ecs";
import { voxelRendering, cameraControl } from "plugins/index.js";

export function createHelloModelService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                hello_model_init: {
                    create: db => {
                        console.log("initializing test models");
                        db.transactions.createAxis();
                        // Enable orbit camera control
                        db.store.resources.cameraControlType = "orbit";
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
            extends: Database.Plugin.combine(voxelRendering, cameraControl)
        })
    );
}

export type HelloModelService = ReturnType<typeof createHelloModelService>;

