import type { Vec2, Vec3 } from "math/index.js";
import type { Camera } from "./camera.js";
import * as MAT4 from "math/mat4x4/functions.js";
import * as VEC3 from "math/vec3/functions.js";

/**
 * Converts a world space coordinate to screen space coordinates and depth.
 * 
 * @param worldPosition - The 3D world position to convert
 * @param camera - The camera resource containing position, target, FOV, etc.
 * @param canvasWidth - The width of the canvas in pixels
 * @param canvasHeight - The height of the canvas in pixels
 * @returns Screen space coordinates and depth [x, y, depth] where (0,0) is top-left and (width,height) is bottom-right, depth is 0-1 (near=0, far=1) or 2 for behind camera
 */
export const worldToScreen = (
    worldPosition: Vec3,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
): [number, number, number] => {
    // Create the view-projection matrix (same as used in the shader)
    const perspective = MAT4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = MAT4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = MAT4.multiply(perspective, lookAt);
    
    // Transform world position to clip space
    const clipSpace = MAT4.multiplyVec4(viewProjection, [...worldPosition, 1]);
    
    // Check if point is behind camera (W < 0)
    if (clipSpace[3] <= 0) {
        // Return invalid coordinates for points behind camera
        return [canvasWidth * 2, canvasHeight * 2, 2.0];
    }
    
    // Perform perspective divide to get normalized device coordinates (NDC)
    const ndcX = clipSpace[0] / clipSpace[3];
    const ndcY = clipSpace[1] / clipSpace[3];
    const ndcZ = clipSpace[2] / clipSpace[3];
    
    // Convert NDC to screen coordinates
    // NDC: (-1,-1) is bottom-left, (1,1) is top-right
    // Screen: (0,0) is top-left, (width,height) is bottom-right
    const screenX = (ndcX + 1) * 0.5 * canvasWidth;
    const screenY = (1 - ndcY) * 0.5 * canvasHeight; // Flip Y axis
    
    // Calculate normalized depth (0 to 1)
    // The perspective matrix uses reversed depth (near=1, far=0)
    // So we need to invert the depth calculation
    const depth = 1.0 - (ndcZ + 1) * 0.5;
    
    return [screenX, screenY, depth];
}; 