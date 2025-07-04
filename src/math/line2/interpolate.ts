import { Vec2 } from "../vec2/index.js";
import { Line2 } from "./line2.js";

export const interpolate = (line: Line2, alpha: number): Vec2 => {
    const a = line.a;
    const b = line.b;
    return [a[0] + alpha * (b[0] - a[0]), a[1] + alpha * (b[1] - a[1])];
};
