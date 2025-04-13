import { Mat4x4_lookAt } from "../../Mat4x4/functions";
import { Mat4x4_multiply } from "../../Mat4x4";
import { Mat4x4_perspective } from "../../Mat4x4";
import { Camera } from "./Camera";

export const Camera_toViewProjection = (camera: Camera) => {
    const perspective = Mat4x4_perspective(camera.fieldOfView, camera.aspect, camera.nearPlane, camera.farPlane);
    const lookAt = Mat4x4_lookAt(camera.position, camera.target, camera.up);
    const viewProjection = Mat4x4_multiply(perspective, lookAt);
    return viewProjection;
}