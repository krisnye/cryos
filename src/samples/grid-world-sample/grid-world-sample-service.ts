import { Database } from "@adobe/data/ecs";
import { particleRendering } from "../../plugins/particle-rendering/particle-rendering.js";
import { cameraControl } from "../../plugins/camera-control.js";
import { materialVertexBufferRenderer } from "../../plugins/material-vertex-buffer-renderer/material-vertex-buffer-renderer.js";
import { materialVolumeToVertexBuffers } from "../../plugins/material-volume-to-vertex-buffers/material-volume-to-vertex-buffers.js";
import { scene as gridWorld } from "../../plugins/grid-world.js";
import { playerModel } from "./player-model.js";
import { playerModelInput } from "./player-model-input.js";
import { createCheckerboardChunk } from "./create-simple-chunk.js";
import { createMechRobot } from "./create-mech-robot.js";
import { getTerrainHeight, MAX_TERRAIN_HEIGHT_BLOCKS } from "./terrain-height.js";
import { Material } from "../../types/material/material.js";

export function createGridWorldSampleService() {
    return Database.create(
        Database.Plugin.create({
            extends: Database.Plugin.combine(
                gridWorld,
                playerModelInput,
                particleRendering,
                materialVolumeToVertexBuffers,
                materialVertexBufferRenderer,
                cameraControl
            ),
            systems: {
                grid_world_sample_init: {
                    create: db => {
                        // Create axis using particle rendering
                        db.transactions.createAxis();
                        
                        // Create chunks around the origin using adjacent chunk indexes
                        // Chunk indexes: 0,0, 0,1, 0,2, 1,0, 1,1, 1,2, 2,0, 2,1, 2,2
                        // Position is calculated internally as chunkX * chunkSize, chunkY * chunkSize
                        // Each chunk uses the same checkerboard pattern but with different materials
                        const materials = [
                            Material.ids.concrete,
                            Material.ids.steel,
                            Material.ids.rock,
                            Material.ids.iron,
                            Material.ids.marble,
                            Material.ids.granite,
                            Material.ids.metaCyan,
                            Material.ids.metaBlue,
                            Material.ids.metaTeal,
                        ];
                        
                        let materialIndex = 0;
                        for (let chunkY = 0; chunkY < 3; chunkY++) {
                            for (let chunkX = 0; chunkX < 3; chunkX++) {
                                const materialId = materials[materialIndex % materials.length];
                                const volume = createCheckerboardChunk(materialId, chunkX, chunkY);
                                
                                db.transactions.createWorldChunk({
                                    chunkX,
                                    chunkY,
                                    volumeModel: volume,
                                });
                                
                                materialIndex++;
                            }
                        }
                        
                        // Set camera to look down at the terrain from far above
                        // Center of 3x3 grid: chunk (1,1) at world position (64, 64, 0) assuming chunkSize=64
                        // Position camera high above and far back for top-down view
                        const centerX = 64; // Center of middle chunk
                        const centerY = 64;
                        const centerZ = 0;
                        const cameraHeight = 200; // High above
                        const cameraDistance = 150; // Far back
                        
                        db.store.resources.camera = {
                            ...db.store.resources.camera,
                            position: [centerX, centerY - cameraDistance, centerZ + cameraHeight],
                            target: [centerX, centerY, centerZ],
                            up: [0, 0, 1]
                        };
                        
                        // Enable orbit camera control
                        db.store.resources.cameraControlType = "orbit";
                        
                        // Calculate terrain height at player position
                        const { blockSize } = db.store.resources.worldScale;
                        const playerWorldX = 5;
                        const playerWorldY = 5;
                        
                        const terrainHeight = getTerrainHeight(playerWorldX, playerWorldY, MAX_TERRAIN_HEIGHT_BLOCKS, blockSize);
                        
                        // Create player mech robot on top of terrain
                        // Create mech robot volume
                        const mechRobotVolume = createMechRobot();
                        
                        // Create player entity with mech robot volume, positioned on top of terrain
                        const playerEntity = db.transactions.createPlayer({
                            position: [playerWorldX, playerWorldY, terrainHeight],
                            materialVolume: mechRobotVolume,
                        });
                        
                        // Verify player was created and can be queried
                        const playerTables = db.store.queryArchetypes(["player", "position"]);
                        console.log("After createPlayer - Player tables found:", playerTables.length);
                        for (let i = 0; i < playerTables.length; i++) {
                            const table = playerTables[i];
                            console.log(`  Table ${i}: rowCount=${table.rowCount}`);
                            if (table.rowCount > 0) {
                                const entity = table.columns.id.get(0);
                                const position = table.columns.position.get(0);
                                console.log(`    Entity: ${entity}, Position:`, position);
                            }
                        }
                        
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
        })
    );
}

export type GridWorldSampleService = ReturnType<typeof createGridWorldSampleService>;

