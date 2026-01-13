import { Database } from "@adobe/data/ecs";
import { particleRendering, cameraControl } from "../../plugins/index.js";
import { createSampleParticles, createMaterialPyramid } from "./particle-sample-helpers.js";

export function createParticleSampleService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                particle_sample_init: {
                    create: db => {
                        console.log("initializing particle sample");
                        db.transactions.createAxis();
                        createSampleParticles(db);
                        createMaterialPyramid(db);
                        
                        // Enable orbit camera control
                        db.store.resources.cameraControlType = "orbit";
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
            extends: Database.Plugin.combine(particleRendering, cameraControl)
        })
    );
}

export type ParticleSampleService = ReturnType<typeof createParticleSampleService>;

