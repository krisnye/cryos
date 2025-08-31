import { Vec2, Vec3, Vec4 } from "math/index.js";

export function getSpatialMapKey(x: number, y: number): number {
    return Math.floor(y) << 16 | Math.floor(x);
}
