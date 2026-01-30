import { Database, Entity } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { keyInput } from "../../plugins/key-input.js";
import { playerModel } from "./player-model.js";
import { scene as gridWorld } from "../../plugins/grid-world.js";
import { getTerrainHeight, MAX_TERRAIN_HEIGHT_BLOCKS } from "./terrain-height.js";

export const playerModelInput = Database.Plugin.create({
    extends: Database.Plugin.combine(playerModel, keyInput, gridWorld),
    systems: {
        playerInput: {
            create: (db) => {
                // Track processed repeat counts for each key to handle OS key repeats
                const processedRepeats = new Map<string, number>();
                
                return () => {
                    const { pressedKeys, worldScale } = db.store.resources;
                    const { blockSize } = worldScale;
                    
                    // Find the player entity using select
                    const playerEntities = db.store.select(["player", "position"]);
                    
                    if (playerEntities.length === 0) {
                        processedRepeats.clear();
                        return;
                    }
                    
                    // Get the first player entity
                    const playerEntity = playerEntities[0];
                    const currentPosition = db.store.get(playerEntity, "position");
                    
                    if (!currentPosition) {
                        processedRepeats.clear();
                        return;
                    }
                    
                    // Check for movement keys (IJKL) - move once per key press/repeat
                    // Note: KeyboardEvent.code uses "KeyI", "KeyJ", "KeyK", "KeyL" regardless of shift/caps
                    let deltaX = 0;
                    let deltaY = 0;
                    
                    const movementKeys = ["KeyI", "KeyJ", "KeyK", "KeyL"] as const;
                    
                    for (const keyCode of movementKeys) {
                        const keyState = pressedKeys[keyCode];
                        if (!keyState) {
                            // Key not pressed, remove from processed repeats
                            processedRepeats.delete(keyCode);
                            continue;
                        }
                        
                        // Check if this is a new key press or repeat we haven't processed yet
                        const lastProcessed = processedRepeats.get(keyCode) ?? 0;
                        if (keyState.repeatCount > lastProcessed) {
                            // New press or repeat - process it
                            processedRepeats.set(keyCode, keyState.repeatCount);
                            
                            // Apply movement based on key
                            if (keyCode === "KeyI") {
                                deltaY += blockSize; // I = forward (+Y)
                            } else if (keyCode === "KeyK") {
                                deltaY -= blockSize; // K = backward (-Y)
                            } else if (keyCode === "KeyJ") {
                                deltaX -= blockSize; // J = left (-X)
                            } else if (keyCode === "KeyL") {
                                deltaX += blockSize; // L = right (+X)
                            }
                        }
                    }
                    
                    // Only move if there's a delta
                    if (deltaX !== 0 || deltaY !== 0) {
                        const newX = currentPosition[0] + deltaX;
                        const newY = currentPosition[1] + deltaY;
                        
                        // Calculate terrain height at new position
                        // getTerrainHeight returns height in world units (already accounts for blockSize)
                        const terrainHeight = getTerrainHeight(newX, newY, MAX_TERRAIN_HEIGHT_BLOCKS, blockSize);
                        
                        // Move player using semantic transaction that handles both movement and rotation
                        db.transactions.movePlayer({
                            entityId: playerEntity,
                            delta: [deltaX, deltaY, 0],
                            terrainHeight,
                        });
                    }
                };
            },
            schedule: { during: ["update"] }
        }
    },
});

