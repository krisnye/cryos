import { Database } from "@adobe/data/ecs";
import { particleRendering, cameraControl } from "../../plugins/index.js";

export function createParticleSampleService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                particle_sample_init: {
                    create: db => {
                        db.transactions.createAxis();
                        db.transactions.createSampleParticles();
                        db.transactions.createMaterialPyramid();
                        
                        // Set camera to look from +x/+y/+z direction towards origin
                        // Distance: ~20 units (about 2x the default 10)
                        // Position at [d, d, d] where d√3 = 20, so d ≈ 11.55
                        const cameraDistance = 35;
                        const d = cameraDistance / Math.sqrt(3);
                        db.store.resources.camera = {
                            ...db.store.resources.camera,
                            position: [d, d, d],
                            target: [0, 0, 0],
                            up: [0, 0, 1]
                        };
                        
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

