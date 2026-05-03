import { Vec3, Vec4, Mat4x4, Line3 } from "@adobe/data/math";
import { Camera } from "./camera.js";

/**
 * Converts screen coordinates to a world space pick line for ray casting.
 * Based on cryos-old implementation which creates a line from near plane extended to a specific length.
 * 
 * @param camera Camera with position, target, and projection parameters
 * @param screenX Screen X coordinate (canvas-relative)
 * @param screenY Screen Y coordinate (canvas-relative)
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @param rayLength The length of the ray in world units (default: 1000)
 * @returns A Line3 representing the ray from near plane through the screen point
 */
export const screenToWorldRay = (
    camera: Camera,
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number,
    rayLength: number = 1000
): Line3 => {
    // Convert screen coordinates to normalized device coordinates (NDC)
    // Screen: (0,0) is top-left, (width,height) is bottom-right
    // NDC: (-1,-1) is bottom-left, (1,1) is top-right
    const ndcX = (screenX / canvasWidth) * 2 - 1;
    const ndcY = 1 - (screenY / canvasHeight) * 2; // Flip Y axis (screen Y increases downward)
    
    // Create two points in clip space: near plane and far plane
    // Near plane is at z = -1 (closer to camera), far plane is at z = 1 (farther from camera)
    const nearPoint: Vec4 = [ndcX, ndcY, -1, 1];
    const farPoint: Vec4 = [ndcX, ndcY, 1, 1];
    
    // Get view-projection matrix and invert it
    const viewProjection = Camera.toViewProjection(camera);
    const invViewProjection = Mat4x4.inverse(viewProjection);
    
    // Transform to world space
    const nearWorld = Mat4x4.multiplyVec4(invViewProjection, nearPoint);
    const farWorld = Mat4x4.multiplyVec4(invViewProjection, farPoint);
    
    // Perform perspective divide and ensure Vec3 type
    const nearWorldPos: Vec3 = [
        nearWorld[0] / nearWorld[3],
        nearWorld[1] / nearWorld[3],
        nearWorld[2] / nearWorld[3]
    ];
    const farWorldPos: Vec3 = [
        farWorld[0] / farWorld[3],
        farWorld[1] / farWorld[3],
        farWorld[2] / farWorld[3]
    ];
    
    // Calculate ray direction (from near to far, which should point towards negative Z into the scene)
    // The old project uses Vec3.subtract(nearWorldPos, farWorldPos) which gives the correct direction
    // This is: nearWorldPos - farWorldPos, which points from far plane towards near plane
    // When we extend from the near plane point, this correctly points into the scene
    const rayDirection: Vec3 = [
        nearWorldPos[0] - farWorldPos[0],
        nearWorldPos[1] - farWorldPos[1],
        nearWorldPos[2] - farWorldPos[2]
    ];
    
    // Normalize the direction
    const dirLength = Math.sqrt(
        rayDirection[0] * rayDirection[0] +
        rayDirection[1] * rayDirection[1] +
        rayDirection[2] * rayDirection[2]
    );
    
    if (dirLength < 0.0001) {
        // If direction is too small, fall back to using far plane point
        return {
            a: nearWorldPos,
            b: farWorldPos
        };
    }
    
    const normalizedDir: Vec3 = [
        rayDirection[0] / dirLength,
        rayDirection[1] / dirLength,
        rayDirection[2] / dirLength
    ];
    
    // Create the ray end point at the specified length from the near plane point
    const rayEnd: Vec3 = [
        nearWorldPos[0] + normalizedDir[0] * rayLength,
        nearWorldPos[1] + normalizedDir[1] * rayLength,
        nearWorldPos[2] + normalizedDir[2] * rayLength
    ];
    
    return {
        a: nearWorldPos,
        b: rayEnd
    };
};

