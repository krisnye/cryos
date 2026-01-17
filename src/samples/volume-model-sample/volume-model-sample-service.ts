import { Database } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { particleRendering, cameraControl, volumeModelRendering } from "../../plugins/index.js";
import { materialVolumeToVertexBuffers } from "../../plugins/material-volume-to-vertex-buffers.js";
import { createHouseChunkVolume } from "./create-house-chunk.js";

export function createVolumeModelSampleService() {
    return Database.create(
        Database.Plugin.create({
            extends: Database.Plugin.combine(particleRendering, volumeModelRendering, materialVolumeToVertexBuffers, cameraControl),
            systems: {
                volume_model_sample_init: {
                    create: db => {
                        // Create axis using particle rendering
                        db.transactions.createAxis();
                        
                        // Create house chunk volume model
                        // Each voxel is 25cm, so 16x16x16 = 4m x 4m x 4m
                        // Position it so it's visible from the camera
                        const houseVolume = createHouseChunkVolume();
                        const voxelSize = 0.25; // 25cm per voxel
                        const houseSize = 16 * voxelSize; // 4m
                        
                        // Position house at origin, scale by voxel size
                        db.transactions.createVolumeModel({
                            position: [0, 0, 0],
                            materialVolume: houseVolume,
                            scale: [voxelSize, voxelSize, voxelSize] as Vec3,
                        });
                        
                        // Set camera to look at the house from a good angle
                        const cameraDistance = 12;
                        const d = cameraDistance / Math.sqrt(3);
                        db.store.resources.camera = {
                            ...db.store.resources.camera,
                            position: [d, d, d],
                            target: [0, 0, houseSize / 2],
                            up: [0, 0, 1]
                        };
                        
                        // Enable orbit camera control
                        db.store.resources.cameraControlType = "orbit";
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
        })
    );
}

export type VolumeModelSampleService = ReturnType<typeof createVolumeModelSampleService>;

