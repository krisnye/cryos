import { Mat4x4 } from "@adobe/data/math";
import type { Camera } from "./camera.js";

export const toViewProjection = (camera: Camera): Mat4x4 => {
    const perspective = Mat4x4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = Mat4x4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = Mat4x4.multiply(perspective, lookAt);
    return viewProjection;
};