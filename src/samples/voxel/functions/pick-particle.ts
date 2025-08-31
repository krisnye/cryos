import { VoxelStore } from "../services/voxel-store.js";
import { screenToWorldRay, toViewProjection } from "graphics/camera/index.js";
import * as MAT4 from "math/mat4x4/functions.js";
import { pickFromSpatialMap } from "../types/spatial-map/index.js";
import { Vec2, Vec3 } from "math/index.js";

/**
 * Picks a particle from a screen position using spatial mapping.
 * @param store - The voxel store containing particles and resources
 * @param screenPosition - The screen position as Vec2 [x, y]
 * @returns The picked result with entity, position, and face, or null if nothing picked
 */
export const pickParticle = (store: VoxelStore, screenPosition: Vec2) => {
    const camera = store.resources.camera;
    const canvasWidth = store.resources.graphics.canvas.width;
    const canvasHeight = store.resources.graphics.canvas.height;
    
    // Compute the inverse view-projection matrix
    const viewProjection = toViewProjection(camera);
    const invViewProjection = MAT4.inverse(viewProjection);
    
    // Convert screen position to world space pick line
    const pickLine = screenToWorldRay(screenPosition, invViewProjection, canvasWidth, canvasHeight);
    
    // Use voxel-based spatial lookup for picking static particles
    // radius: 0 for precise picking, larger values for collision detection
    const picked = pickFromSpatialMap(
        store.resources.mapColumns,
        pickLine,
        0,
        (entity) => store.get(entity, "boundingBox")!
    );

    if (!picked) {
        return null;
    }

    // Extract position from position_scale (first 3 components)
    const position: Vec3 = store.read(picked.entity)!.position_scale.slice(0, 3) as unknown as Vec3;
    
    return {
        entity: picked.entity,
        position,
        face: picked.face
    };
}; 