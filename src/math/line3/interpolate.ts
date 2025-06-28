import { Vec3 } from "../vec3/index.js";
import { Line3 } from "./line3.js";

export const interpolate = (line: Line3, alpha: number): Vec3 => {
    const a = line.a;
    const b = line.b;
    return [a[0] + alpha * (b[0] - a[0]), a[1] + alpha * (b[1] - a[1]), a[2] + alpha * (b[2] - a[2])];
}; 