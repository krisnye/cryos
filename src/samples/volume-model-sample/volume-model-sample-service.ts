import { Database } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { particleRendering } from "../../plugins/particle-rendering/particle-rendering.js";
import { cameraControl } from "../../plugins/camera-control.js";
import { materialVertexBufferRenderer } from "../../plugins/material-vertex-buffer-renderer/material-vertex-buffer-renderer.js";
import { materialVolumeToVertexBuffers } from "../../plugins/material-volume-to-vertex-buffers/material-volume-to-vertex-buffers.js";
import { DenseVolumeMaterial } from "../../types/dense-volume-material/dense-volume-material.js";
import { createTerrainAndTowerVolume } from "./create-terrain-and-tower.js";

export function createVolumeModelSampleService() {
    return Database.create(
        Database.Plugin.create({
            extends: Database.Plugin.combine(particleRendering, materialVolumeToVertexBuffers, materialVertexBufferRenderer, cameraControl),
            systems: {
                volume_model_sample_init: {
                    create: db => {
                        // Create axis using particle rendering
                        db.transactions.createAxis();
                        
                        const voxelSize = 0.25; // 25cm per voxel
                        
                        // Create house chunk volume model (DenseVolume)
                        // Each voxel is 25cm, so 16x16x16 = 4m x 4m x 4m
                        const houseVolume = DenseVolumeMaterial.createHouseChunk();
                        const houseSize = 16 * voxelSize; // 4m
                        
                        // Position house to the left
                        db.transactions.createVolumeModel({
                            position: [-6, 0, 0],
                            materialVolume: houseVolume,
                            scale: [voxelSize, voxelSize, voxelSize] as Vec3,
                        });
                        
                        // Create terrain and tower volume model (ColumnVolume)
                        const terrainTowerVolume = createTerrainAndTowerVolume();
                        const terrainSize = 16 * voxelSize; // 4m
                        
                        // Create a 16x16 grid of towers (16 units apart in x and y)
                        const gridSize = 16;
                        const spacing = 4; // 16 units apart
                        const startOffset = -(gridSize * spacing) / 2; // Center the grid
                        
                        for (let y = 0; y < gridSize; y++) {
                            for (let x = 0; x < gridSize; x++) {
                                const positionX = startOffset + x * spacing;
                                const positionY = startOffset + y * spacing;
                                
                                db.transactions.createVolumeModel({
                                    position: [positionX, positionY, 0],
                                    materialVolume: terrainTowerVolume, // Reuse the same volume object
                                    scale: [voxelSize, voxelSize, voxelSize] as Vec3,
                                });
                            }
                        }
                        
                        // Also keep the original single tower for comparison
                        // Position terrain and tower to the right
                        db.transactions.createVolumeModel({
                            position: [6, 0, 0],
                            materialVolume: terrainTowerVolume,
                            scale: [voxelSize, voxelSize, voxelSize] as Vec3,
                        });
                        
                        // Set camera to look at both volumes from a good angle
                        const cameraDistance = 20;
                        const d = cameraDistance / Math.sqrt(3);
                        db.store.resources.camera = {
                            ...db.store.resources.camera,
                            position: [d, d, d],
                            target: [0, 0, Math.max(houseSize, terrainSize) / 2],
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

