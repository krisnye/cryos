import { Vec2, Mat4x4, Vec3, Line3 } from "@adobe/data/math";

/**
 * Converts screen coordinates to a world space pick line for ray casting.
 *
 * @param screenPosition - Screen coordinates [x, y] where (0,0) is top-left
 * @param invViewProjection - The inverse view-projection matrix
 * @param canvasWidth - The width of the canvas in pixels
 * @param canvasHeight - The height of the canvas in pixels
 * @param rayLength - The length of the ray in world units (default: 1000)
 * @returns A Line3 representing the ray from near plane through the screen point
 */
export const screenToWorldRay = (
    screenPosition: Vec2,
    invViewProjection: Mat4x4,
    canvasWidth: number,
    canvasHeight: number,
    rayLength: number = 1000
): Line3 => {
    // Convert screen coordinates to normalized device coordinates (NDC)
    // Screen: (0,0) is top-left, (width,height) is bottom-right
    // NDC: (-1,-1) is bottom-left, (1,1) is top-right
    const ndcX = (screenPosition[0] / canvasWidth) * 2 - 1;
    const ndcY = 1 - (screenPosition[1] / canvasHeight) * 2; // Flip Y axis

    // Create two points in clip space: near plane and far plane
    // Near plane is at z = -1 (closer to camera), far plane is at z = 1 (farther from camera)
    const nearPoint = [ndcX, ndcY, -1, 1] as const;
    const farPoint = [ndcX, ndcY, 1, 1] as const;

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

    // Calculate ray direction (from near to far, which should point towards negative Z)
    const rayDirection = Vec3.normalize(Vec3.subtract(nearWorldPos, farWorldPos));

    // Create the ray end point at the specified length from the near plane point
    const rayEnd: Vec3 = [
        nearWorldPos[0] + rayDirection[0] * rayLength,
        nearWorldPos[1] + rayDirection[1] * rayLength,
        nearWorldPos[2] + rayDirection[2] * rayLength
    ];

    return {
        a: nearWorldPos,
        b: rayEnd
    };
}; 