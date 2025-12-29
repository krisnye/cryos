import { Mat4x4, Vec3 } from "@adobe/data/math";
import { Camera } from "./camera.js";

export const toViewProjection = (camera: Camera): Mat4x4 => {
    // 1. Create the view matrix (lookAt)
    const lookAt = Mat4x4.lookAt(camera.position, camera.target, camera.up);
    
    // 2. Build projection matrix with orthographic blend
    const fov = camera.fieldOfView;
    const aspect = camera.aspect;
    const near = camera.nearPlane;
    const far = camera.farPlane;
    const orthographic = camera.orthographic;
    
    // Standard perspective matrix coefficients (matching Mat4x4.perspective)
    const f = 1.0 / Math.tan(fov / 2);
    const nf = near / (near - far);
    
    // Calculate focus depth (distance from camera to target)
    const d = Vec3.distance(camera.position, camera.target);
    
    // Build projection matrix with modified fourth row for ortho blend
    // Fourth row (indices 3, 7, 11, 15) blends: w' = (1 - orthographic) * (-z) + orthographic * d
    // When orthographic = 0: fourth row is [0, 0, -1, 0] → pure perspective (w = -z)
    // When orthographic = 1: fourth row is [0, 0, 0, d] → pure orthographic (w = d, constant)
    const perspective: Mat4x4 = [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, nf, -(1 - orthographic),
        0, 0, near * nf, orthographic * d
    ];
    
    // 3. Combine projection and view
    const viewProjection = Mat4x4.multiply(perspective, lookAt);
    return viewProjection;
};