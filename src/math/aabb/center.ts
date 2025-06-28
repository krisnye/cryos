import { Vec3 } from "math/vec3/vec3.js";
import { Aabb } from "./aabb.js";

export function center(aabb: Aabb): Vec3 {
    return [
        (aabb.min[0] + aabb.max[0]) / 2,
        (aabb.min[1] + aabb.max[1]) / 2,
        (aabb.min[2] + aabb.max[2]) / 2,
    ];
}