import * as MAT4 from "math/mat4x4";
import type { Mat4x4 } from "math";
import type { Camera } from "./camera";

export const toViewProjection = (camera: Camera): Mat4x4 => {
    const perspective = MAT4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = MAT4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = MAT4.multiply(perspective, lookAt);
    return viewProjection;
};