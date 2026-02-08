import { Database } from "@adobe/data/ecs";
import { Aabb, Line3, Vec3 } from "@adobe/data/math";
import { pointerInput } from "../../plugins/pointer-input.js";
import { keyInput } from "../../plugins/key-input.js";
import { gridWorld as gridWorld } from "../../plugins/grid-world/grid-world.js";
import { scene } from "../../plugins/scene.js";
import { particle } from "../../plugins/particle.js";
import { playerModel } from "./player-model.js";
import { Camera } from "../../types/camera/camera.js";
import { PickResult } from "../../types/pick-result.js";
import { Volume } from "../../types/volume/volume.js";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import * as Particle from "../../types/particle/public.js";

export const pickInput = Database.Plugin.create({
    extends: Database.Plugin.combine(pointerInput, keyInput, gridWorld, scene, particle, playerModel),
    resources: {
        pickTarget: { default: null as Vec3 | null },
    },
    transactions: {
        createBullet(t, props: {
            position: Vec3;
            velocity: Vec3;
        }) {
            // Create larger steel bullet at position
            const bulletEntity = t.archetypes.ParticleScale.insert({
                particle: true as const,
                position: props.position,
                scale: [2, 2, 2],
                material: Material.ids.steel,
            });
            
            // Add velocity component
            t.update(bulletEntity, {
                velocity: props.velocity,
            });
            
            return bulletEntity;
        },
    },
    systems: {
        pickInput: {
            create: (db) => {
                // Track line indicator particle entity and last pick position
                let lineParticleEntity: number | null = null;
                let lastPlayerPosition: Vec3 | null = null;
                
                // Helper function to update line particle from current player position to last pick position
                const updateLineParticle = () => {
                    const { pickTarget } = db.store.resources;
                    if (lineParticleEntity === null || pickTarget === null) {
                        return;
                    }
                    
                    // Get current player position
                    const playerEntities = db.store.select(["player", "position"]);
                    if (playerEntities.length === 0) {
                        return;
                    }
                    
                    const playerEntity = playerEntities[0];
                    const currentPlayerPosition = db.get(playerEntity, "position");
                    
                    if (!currentPlayerPosition) {
                        return;
                    }
                    
                    // Check if player position changed
                    if (lastPlayerPosition && 
                        currentPlayerPosition[0] === lastPlayerPosition[0] &&
                        currentPlayerPosition[1] === lastPlayerPosition[1] &&
                        currentPlayerPosition[2] === lastPlayerPosition[2]) {
                        // Player hasn't moved, no update needed
                        return;
                    }
                    
                    // Update last known player position
                    lastPlayerPosition = currentPlayerPosition;
                    
                    // Create line from current player position to last pick position
                    const lineToPick: Line3 = {
                        a: currentPlayerPosition,
                        b: pickTarget
                    };
                    
                    // Get transforms for line particle
                    const lineTransforms = Particle.fromLine({
                        line: lineToPick,
                        radius: 0.3, // Thin line indicator
                    });
                    
                    // Update the line particle with new transforms
                    db.store.update(lineParticleEntity, {
                        position: lineTransforms.position,
                        scale: lineTransforms.scale,
                        rotation: lineTransforms.rotation,
                    });
                };
                
                return () => {
                    const { activePointers, camera, canvas } = db.store.resources;
                    
                    if (!camera || !canvas) return;
                    
                    // Update line particle if player moved (runs every frame)
                    updateLineParticle();
                    
                    // Get canvas dimensions
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    
                    // Get canvas bounding rect to convert document coordinates to canvas-relative coordinates
                    const canvasBounds = canvas.getBoundingClientRect();
                    
                    // Process each active pointer that was just clicked (frameCount === 0)
                    Object.entries(activePointers).forEach(([pointerIdStr, pointerState]) => {
                        // Only process left mouse button clicks (button === 0) on the first frame
                        if (pointerState.button === 0 && pointerState.frameCount === 0) {
                            // Convert document-relative coordinates to canvas-relative coordinates
                            // pointerState.initialPosition contains clientX/clientY (document-relative)
                            // We need to subtract canvas bounds to get canvas-relative coordinates
                            const screenX = pointerState.initialPosition[0] - canvasBounds.left;
                            const screenY = pointerState.initialPosition[1] - canvasBounds.top;
                            
                            // Convert screen coordinates to world space pick line (from near plane to far plane)
                            const line = Camera.screenToWorldRay(
                                camera,
                                screenX,
                                screenY,
                                canvasWidth,
                                canvasHeight
                            );
                            
                            // Pick from world
                            const pickResult = db.resources.pick(line);
                            
                            // Get material and material name if pick result exists
                            let material: Material.Id | null = null;
                            let materialName: string | null = null;
                            let faceName: string | null = null;
                            if (pickResult) {
                                const materialVolume = db.get(pickResult.entity, "materialVolume");
                                if (materialVolume && pickResult.modelPosition) {
                                    const [x, y, z] = pickResult.modelPosition;
                                    const voxel = Volume.get(materialVolume, x, y, z);
                                    if (voxel !== null) {
                                        material = PhysicalVoxel.getMaterialId(voxel);
                                        materialName = Material.getName(material);
                                    }
                                }
                                if (pickResult.face !== undefined) {
                                    faceName = Aabb.Face.getName(pickResult.face);
                                }
                            }
                            
                            // Log clean information
                            const logData = {
                                pickLine: {
                                    a: line.a,
                                    b: line.b
                                },
                                pickResult: pickResult ? {
                                    entity: pickResult.entity,
                                    lineAlpha: pickResult.lineAlpha,
                                    worldPosition: pickResult.worldPosition,
                                    modelPosition: pickResult.modelPosition,
                                    modelCoordinates: pickResult.modelCoordinates,
                                    material: material,
                                    materialName: materialName,
                                    face: pickResult.face,
                                    faceName: faceName
                                } : null
                            };
                            console.log("Pick Input:", JSON.stringify(logData, null, 2));
                            
                            // Create or update line indicator from player to picked position
                            if (pickResult) {
                                // Store the pick position (resource so other systems can read it)
                                db.store.resources.pickTarget = pickResult.worldPosition;
                                
                                // Get player position
                                const playerEntities = db.store.select(["player", "position"]);
                                if (playerEntities.length > 0) {
                                    const playerEntity = playerEntities[0];
                                    const playerPosition = db.get(playerEntity, "position");
                                    
                                    if (playerPosition) {
                                        // Store current player position
                                        lastPlayerPosition = playerPosition;
                                        
                                        // Delete previous line particle if it exists
                                        if (lineParticleEntity !== null) {
                                            db.transactions.deleteParticle(lineParticleEntity);
                                        }
                                        
                                        // Create line from player position to picked position
                                        const lineToPick: Line3 = {
                                            a: playerPosition,
                                            b: pickResult.worldPosition
                                        };
                                        
                                        // Get transforms for line particle
                                        const lineTransforms = Particle.fromLine({
                                            line: lineToPick,
                                            radius: 0.3, // Thin line indicator
                                        });
                                        
                                        // Create particle with line transforms and material
                                        lineParticleEntity = db.transactions.createParticle({
                                            ...lineTransforms,
                                            material: Material.ids.metaBlue, // Visible blue line
                                        });
                                    }
                                }
                            }
                        }
                    });
                };
            },
            schedule: { during: ["input", "update"] } // Run during both input and update phases
        },
        pickSpaceHandler: {
            create: (db) => {
                // Track processed repeat counts for each number key
                const processedRepeats = new Map<string, number>();
                
                return () => {
                    const { pressedKeys, pickTarget } = db.store.resources;
                    
                    // Check for number keys 1-9
                    const numberKeys = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"] as const;
                    
                    for (const keyCode of numberKeys) {
                        const keyState = pressedKeys[keyCode];
                        if (!keyState) {
                            // Key not pressed, remove from processed repeats
                            processedRepeats.delete(keyCode);
                            continue;
                        }
                        
                        // Check if this is a new press we haven't processed yet
                        const lastProcessed = processedRepeats.get(keyCode) ?? 0;
                        if (keyState.repeatCount > lastProcessed) {
                            // Update last processed repeat count
                            processedRepeats.set(keyCode, keyState.repeatCount);
                            
                            // Extract number from key code (e.g., "Digit1" -> 1)
                            const number = parseInt(keyCode.replace("Digit", ""), 10);
                            
                            // Get robot (player) position
                            const playerEntities = db.store.select(["player", "position"]);
                            if (playerEntities.length === 0) {
                                console.log("pickSpaceHandler: No player entities found");
                                continue;
                            }
                            
                            const playerEntity = playerEntities[0];
                            const robotPosition = db.get(playerEntity, "position");
                            
                            if (!robotPosition) {
                                console.log("pickSpaceHandler: No robot position found");
                                continue;
                            }
                            
                            // Get target position
                            if (pickTarget === null) {
                                console.log("pickSpaceHandler: No pickTarget set (click somewhere first)");
                                continue;
                            }
                            
                            // Calculate direction from robot to target
                            const direction = Vec3.subtract(pickTarget, robotPosition);
                            const normalizedDirection = Vec3.normalize(direction);
                            
                            // Calculate velocity: number * 10 meters per second
                            const speed = number * 100;
                            const velocity = Vec3.scale(normalizedDirection, speed);
                            
                            // Fire from slightly above and forward from robot (torso height, in front)
                            const heightOffset = 2;
                            const forwardOffset = 2;
                            const firePosition = Vec3.add(
                                Vec3.add(robotPosition, [0, 0, heightOffset]),
                                Vec3.scale(normalizedDirection, forwardOffset)
                            );
                            
                            db.transactions.createBullet({
                                position: firePosition,
                                velocity: velocity,
                            });
                            
                            // Console.log the number and line from fire point to target
                            const line: Line3 = {
                                a: firePosition,
                                b: pickTarget
                            };
                            
                            console.log("Number:", number, "Robot to Target Line:", line, "Velocity:", velocity);
                        }
                    }
                };
            },
            schedule: { during: ["input"] }
        }
    },
});

