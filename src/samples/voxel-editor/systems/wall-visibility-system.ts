import { SystemFactory } from "systems/system-factory.js";
import { VoxelEditorService } from "../voxel-editor-service.js";
import { AabbFace, Vec3, Vec4 } from "@adobe/data/math";
import { applyCheckerboardColor } from "../functions/apply-checkerboard-color.js";
import { getCheckerboardPattern } from "../functions/get-checkerboard-pattern.js";

const WALL_COLOR_LIGHT: Vec4 = [0.6, 0.6, 0.6, 1];
const WALL_COLOR_DARK: Vec4 = [0.4, 0.4, 0.4, 1];
const WALL_COLOR_TRANSPARENT: Vec4 = [0.5, 0.5, 0.5, 0];

/**
 * System that updates wall visibility based on camera position.
 * Walls on the far side of the cube (away from camera) are visible,
 * walls on the near side (toward camera) are transparent.
 */
export const wallVisibilitySystem: SystemFactory<VoxelEditorService> = (service) => {
    const { store } = service;

    return [{
        name: "wallVisibilitySystem",
        phase: "update",
        run: () => {
            const activeViewportId = store.resources.activeViewport;
            if (!activeViewportId) return;

            const viewport = store.read(activeViewportId, store.archetypes.Viewport);
            if (!viewport) return;

            const cameraPosition = viewport.camera.position;
            const currentModelSize = store.resources.modelSize;
            
            // Get all wall entities
            const wallTables = store.queryArchetypes(store.archetypes.Wall.components);

            for (const table of wallTables) {
                const entityIds = table.columns.id.getTypedArray();
                
                for (let i = 0; i < table.rowCount; i++) {
                    const entityId = entityIds[i];
                    const wallFace = table.columns.wallFace.get(i);
                    const wallPosition = table.columns.position.get(i);
                    
                    // Determine if this wall face should be visible
                    // A wall is visible if it's on the far side (camera direction points away from it)
                    const shouldBeVisible = isWallFacingAway(wallFace, wallPosition, cameraPosition);
                    
                    let targetColor: Vec4;
                    if (shouldBeVisible) {
                        // Apply checkerboard pattern for visible walls
                        const isLight = getCheckerboardPattern(wallPosition);
                        const baseColor = isLight ? WALL_COLOR_LIGHT : WALL_COLOR_DARK;
                        // Apply extended region checkerboard if applicable
                        targetColor = applyCheckerboardColor(wallPosition, baseColor, currentModelSize);
                    } else {
                        // Make near walls transparent
                        targetColor = WALL_COLOR_TRANSPARENT;
                    }
                    
                    // Update wall color based on visibility
                    store.update(entityId, { color: targetColor });
                }
            }
        }
    }];
};

/**
 * Determines if a wall face is facing away from the camera (should be visible).
 * Returns true if the wall is on the far side of the model.
 */
function isWallFacingAway(face: AabbFace, wallPosition: Vec3, cameraPosition: Vec3): boolean {
    // Calculate the direction from wall to camera
    const toCamera = Vec3.subtract(cameraPosition, wallPosition);
    
    // Get the normal of the wall face (pointing outward from the cube)
    const faceNormal = AabbFace.getNormal(face);
    
    // If the dot product is negative, the wall is facing away from the camera
    // (the normal points away from the camera direction)
    const dot = Vec3.dot(faceNormal, toCamera);
    
    return dot < 0;
}

