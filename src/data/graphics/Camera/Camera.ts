import { Vec3 } from "../../Vec3";

export type Camera = {
    aspect: number;
    fieldOfView: number;
    nearPlane: number;
    farPlane: number;
    position: Vec3;
    target: Vec3;
    up: Vec3;
}
