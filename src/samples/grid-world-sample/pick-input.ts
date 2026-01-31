import { Database } from "@adobe/data/ecs";
import { Aabb } from "@adobe/data/math";
import { pointerInput } from "../../plugins/pointer-input.js";
import { scene as gridWorld } from "../../plugins/grid-world/grid-world.js";
import { scene } from "../../plugins/scene.js";
import { Camera } from "../../types/camera/camera.js";
import { PickResult } from "../../types/pick-result.js";
import { Volume } from "../../types/volume/volume.js";
import { Material } from "../../types/material/material.js";

export const pickInput = Database.Plugin.create({
    extends: Database.Plugin.combine(pointerInput, gridWorld, scene),
    systems: {
        pickInput: {
            create: (db) => {
                return () => {
                    const { activePointers, camera, canvas } = db.store.resources;
                    
                    if (!camera || !canvas) return;
                    
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
                        }
                    });
                };
            },
            schedule: { during: ["input"] } // Run during input phase
        }
    },
});

