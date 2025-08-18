import { Vec2, Vec3, Vec4 } from "math/index.js";

export function getSpatialMapKey(position: Vec2 | Vec3 | Vec4): number {
    const [x, y] = position;
    return Math.floor(y) << 16 | Math.floor(x);
}
