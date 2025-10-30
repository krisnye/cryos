import { F32Schema, FromSchema, Schema } from "@adobe/data/schema";
import { Line3, Mat4x4, Vec2, Vec3 } from "@adobe/data/math";

// discussion of new unified orthographic/perspective camera
// https://chatgpt.com/share/68d02b24-0ab4-8009-9551-ae1736b95945

export type Camera = FromSchema<typeof Camera.schema>;

export namespace Camera {
    export const schema = {
        type: 'object',
        properties: {
            aspect: F32Schema,
            fieldOfView: F32Schema,
            nearPlane: F32Schema,
            farPlane: F32Schema,
            position: Vec3.schema,
            // when interpolating between perspective and orthographic, the target indicates the focal plane
            // that we fix as the frustrum closer expands and the frustrum further contracts
            target: Vec3.schema,
            up: Vec3.schema,
            orthographic: F32Schema, // 0 = perspective, 1 = orthographic, fractional = hybrid
        },
        required: ["aspect", "fieldOfView", "nearPlane", "farPlane", "position", "target", "up", "orthographic"],
        additionalProperties: false,
    } as const satisfies Schema;

    export type ControlType = "orbit" | "free" | "first-person" | "third-person" | "top-down";

    export const toViewProjection = (camera: Camera): Mat4x4 => {
        const perspective = Mat4x4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
        const lookAt = Mat4x4.lookAt(camera.position, camera.target, camera.up);
        const viewProjection = Mat4x4.multiply(perspective, lookAt);
        return viewProjection;
    };

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
        const perspective = Mat4x4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
        const lookAt = Mat4x4.lookAt(camera.position, camera.target, camera.up);
        const viewProjection = Mat4x4.multiply(perspective, lookAt);
        
        // Transform world position to clip space
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [...worldPosition, 1]);
        
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
}

