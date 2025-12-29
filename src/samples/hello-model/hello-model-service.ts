import { Database } from "@adobe/data/ecs";
import { voxelRendering } from "plugins/index.js";

export function createHelloModelService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                hello_model_init: {
                    create: db => {
                        // do initialization here.
                        console.log("adding test models");
                        db.transactions.createTestModels();
                        return () => {};
                    }
                },
                hello_model_render: {
                    create: db => () => {
                        console.log("myrender " + db.resources.renderPassEncoder);
                    },
                    schedule: {
                        during: ["render"]
                    }
                },
            },
            extends: voxelRendering
        })
    );
}

export type HelloModelService = ReturnType<typeof createHelloModelService>;

