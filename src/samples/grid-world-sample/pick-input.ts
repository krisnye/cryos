import { Database } from "@adobe/data/ecs";
import { Aabb, Line3, Vec3 } from "@adobe/data/math";
import { pointerInput } from "../../plugins/pointer-input.js";
import { scene as gridWorld } from "../../plugins/grid-world/grid-world.js";
import { scene } from "../../plugins/scene.js";
import { particle } from "../../plugins/particle.js";
import { playerModel } from "./player-model.js";
import { Camera } from "../../types/camera/camera.js";
import { PickResult } from "../../types/pick-result.js";
import { Volume } from "../../types/volume/volume.js";
import { Material } from "../../types/material/material.js";
import * as Particle from "../../types/particle/public.js";

export const pickInput = Database.Plugin.create({
    extends: Database.Plugin.combine(pointerInput, gridWorld, scene, particle, playerModel),
    systems: {
        pickInput: {
            create: (db) => {
                // Track line indicator particle entity and last pick position
                let lineParticleEntity: number | null = null;
                let lastPickPosition: Vec3 | null = null;
                let lastPlayerPosition: Vec3 | null = null;
                
                // Helper function to update line particle from current player position to last pick position
                const updateLineParticle = () => {
                    if (lineParticleEntity === null || lastPickPosition === null) {
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
                        b: lastPickPosition
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
                            const pickResult = (db.actions as any).pickWorld(line);
                            
                            // Get material and material name if pick result exists
                            let material: Material.Id | null = null;
                            let materialName: string | null = null;
                            let faceName: string | null = null;
                            if (pickResult) {
                                const materialVolume = db.get(pickResult.entity, "materialVolume");
                                if (materialVolume && pickResult.modelPosition) {
                                    const [x, y, z] = pickResult.modelPosition;
                                    material = Volume.get(materialVolume, x, y, z);
                                    if (material !== null) {
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
                                    material: material,
                                    materialName: materialName,
                                    face: pickResult.face,
                                    faceName: faceName
                                } : null
                            };
                            console.log("Pick Input:", JSON.stringify(logData, null, 2));
                            
                            // Create or update line indicator from player to picked position
                            if (pickResult) {
                                // Store the pick position
                                lastPickPosition = pickResult.worldPosition;
                                
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
        }
    },
});

