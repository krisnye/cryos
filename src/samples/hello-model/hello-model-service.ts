import { Database } from "@adobe/data/ecs";
import { voxelRendering } from "plugins/index.js";

export function createHelloModelService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                hello_model_init: {
                    create: db => {
                        console.log("initializing test models");
                        db.transactions.createTestModels();
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
            extends: voxelRendering
        })
    );
}

export type HelloModelService = ReturnType<typeof createHelloModelService>;

