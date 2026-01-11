import { Database } from "@adobe/data/ecs";
import { Quat } from "@adobe/data/math";
import { particleRendering, cameraControl } from "../../plugins/index.js";
import { Material } from "../../types/index.js";

export function createParticleSampleService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                particle_sample_init: {
                    create: db => {
                        console.log("initializing particle sample");
                        db.transactions.createAxis();
                        
                        const offset = 3; // Offset for different particle groups
                        
                        // Scale-only particles (right side, positive X)
                        const scaleArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "scale"]);
                        scaleArchetype.insert({
                            particle: true,
                            position: [offset, 0, 0],
                            material: Material.id["meta-red"],
                            scale: [2, 1, 1] // Stretched along X
                        });
                        scaleArchetype.insert({
                            particle: true,
                            position: [offset, 1.5, 0],
                            material: Material.id["meta-green"],
                            scale: [1, 2, 1] // Stretched along Y
                        });
                        scaleArchetype.insert({
                            particle: true,
                            position: [offset, -1.5, 0],
                            material: Material.id["meta-blue"],
                            scale: [1, 1, 2] // Stretched along Z
                        });
                        
                        // Rotation-only particles (left side, negative X)
                        const rotationArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "rotation"]);
                        rotationArchetype.insert({
                            particle: true,
                            position: [-offset, 0, 0],
                            material: Material.id["meta-red"],
                            rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4) // 45° around X
                        });
                        rotationArchetype.insert({
                            particle: true,
                            position: [-offset, 1.5, 0],
                            material: Material.id["meta-green"],
                            rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4) // 45° around Y
                        });
                        rotationArchetype.insert({
                            particle: true,
                            position: [-offset, -1.5, 0],
                            material: Material.id["meta-blue"],
                            rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4) // 45° around Z
                        });
                        
                        // Scale + Rotation particles (front side, positive Z)
                        const scaleRotationArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "scale", "rotation"]);
                        scaleRotationArchetype.insert({
                            particle: true,
                            position: [0, 0, offset],
                            material: Material.id["meta-red"],
                            scale: [2, 0.5, 0.5],
                            rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4)
                        });
                        scaleRotationArchetype.insert({
                            particle: true,
                            position: [0, 1.5, offset],
                            material: Material.id["meta-green"],
                            scale: [0.5, 2, 0.5],
                            rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4)
                        });
                        scaleRotationArchetype.insert({
                            particle: true,
                            position: [0, -1.5, offset],
                            material: Material.id["meta-blue"],
                            scale: [0.5, 0.5, 2],
                            rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4)
                        });
                        
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

