import { Vec3 } from "../../math/index.js";

export type Camera = {
    aspect: number;
    fieldOfView: number;
    nearPlane: number;
    farPlane: number;
    position: Vec3;
    target: Vec3;
    up: Vec3;
}
