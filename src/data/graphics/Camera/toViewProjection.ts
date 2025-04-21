import * as mat4 from "../../Mat4x4/functions";
import type { Camera } from "./Camera";
import type { Mat4x4 } from "../../Mat4x4/Mat4x4";

export const toViewProjection = (camera: Camera): Mat4x4 => {
    const perspective = mat4.perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = mat4.lookAt(camera.position, camera.target, camera.up);
    const viewProjection = mat4.multiply(perspective, lookAt);
    return viewProjection;
};