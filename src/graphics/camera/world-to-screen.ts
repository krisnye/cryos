import type { Vec2, Vec3 } from "math/index.js";
import type { Camera } from "./camera.js";
import * as MAT4 from "math/mat4x4/functions.js";
import * as VEC3 from "math/vec3/functions.js";

/**
 * Converts a world space coordinate to screen space coordinates.
 * 
 * @param worldPosition - The 3D world position to convert
 * @param camera - The camera resource containing position, target, FOV, etc.
 * @param canvasWidth - The width of the canvas in pixels
 * @param canvasHeight - The height of the canvas in pixels
 * @returns Screen space coordinates [x, y] where (0,0) is top-left and (width,height) is bottom-right
 */
export const worldToScreen = (
    worldPosition: Vec3,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
): Vec2 => {
    // Create the view-projection matrix (same as used in the shader)
    const perspective = MAT4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = MAT4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = MAT4.multiply(perspective, lookAt);
    
    // Transform world position to clip space
    const clipSpace = MAT4.multiplyVec4(viewProjection, [...worldPosition, 1]);
    
    // Perform perspective divide to get normalized device coordinates (NDC)
    const ndcX = clipSpace[0] / clipSpace[3];
    const ndcY = clipSpace[1] / clipSpace[3];
    
    // Convert NDC to screen coordinates
    // NDC: (-1,-1) is bottom-left, (1,1) is top-right
    // Screen: (0,0) is top-left, (width,height) is bottom-right
    const screenX = (ndcX + 1) * 0.5 * canvasWidth;
    const screenY = (1 - ndcY) * 0.5 * canvasHeight; // Flip Y axis
    
    return [screenX, screenY];
};

/**
 * Checks if a world space position is visible on screen.
 * 
 * @param worldPosition - The 3D world position to check
 * @param camera - The camera resource
 * @param canvasWidth - The width of the canvas in pixels
 * @param canvasHeight - The height of the canvas in pixels
 * @param radius - Optional radius for bounding sphere check (default: 0)
 * @returns true if the position (or bounding sphere) is visible on screen, false otherwise
 */
export const isWorldPositionVisible = (
    worldPosition: Vec3,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number,
    radius: number = 0
): boolean => {
    // If no radius, just check if the center point is on screen
    if (radius <= 0) {
        const screenPos = worldToScreen(worldPosition, camera, canvasWidth, canvasHeight);
        return screenPos[0] >= 0 && screenPos[0] <= canvasWidth &&
               screenPos[1] >= 0 && screenPos[1] <= canvasHeight;
    }
    
    // For bounding sphere, we need to check if any part of the sphere is visible
    // We can approximate this by checking multiple points around the sphere
    
    // Get the center screen position
    const centerScreenPos = worldToScreen(worldPosition, camera, canvasWidth, canvasHeight);
    
    // Check if center is on screen
    if (centerScreenPos[0] >= 0 && centerScreenPos[0] <= canvasWidth &&
        centerScreenPos[1] >= 0 && centerScreenPos[1] <= canvasHeight) {
        return true;
    }
    
    // Check points around the sphere in world space
    const spherePoints: Vec3[] = [
        [worldPosition[0] + radius, worldPosition[1], worldPosition[2]],           // +X
        [worldPosition[0] - radius, worldPosition[1], worldPosition[2]],           // -X
        [worldPosition[0], worldPosition[1] + radius, worldPosition[2]],           // +Y
        [worldPosition[0], worldPosition[1] - radius, worldPosition[2]],           // -Y
        [worldPosition[0], worldPosition[1], worldPosition[2] + radius],           // +Z
        [worldPosition[0], worldPosition[1], worldPosition[2] - radius],           // -Z
    ];
    
    // Check if any of these sphere boundary points are on screen
    for (const point of spherePoints) {
        const screenPos = worldToScreen(point, camera, canvasWidth, canvasHeight);
        if (screenPos[0] >= 0 && screenPos[0] <= canvasWidth &&
            screenPos[1] >= 0 && screenPos[1] <= canvasHeight) {
            return true;
        }
    }
    
    // Additional check: if the sphere is behind the camera but extends into view
    // This is a simplified check - for more accuracy, you'd need to project the sphere
    const cameraToPoint = VEC3.subtract(worldPosition, camera.position);
    const distanceToCamera = VEC3.length(cameraToPoint);
    
    // If sphere is behind camera but close enough, it might be visible
    if (distanceToCamera <= radius) {
        return true;
    }
    
    return false;
};

/**
 * Gets the depth value (Z coordinate in clip space) for a world position.
 * This can be used for depth testing or sorting.
 * 
 * @param worldPosition - The 3D world position
 * @param camera - The camera resource
 * @returns Depth value in clip space (0 = near plane, 1 = far plane)
 */
export const getWorldPositionDepth = (
    worldPosition: Vec3,
    camera: Camera
): number => {
    const perspective = MAT4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = MAT4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = MAT4.multiply(perspective, lookAt);
    
    const clipSpace = MAT4.multiplyVec4(viewProjection, [...worldPosition, 1]);
    
    // Return normalized depth (0 to 1)
    return (clipSpace[2] / clipSpace[3] + 1) * 0.5;
}; 