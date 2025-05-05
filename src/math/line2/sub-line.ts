import { interpolate } from "./interpolate";
import { Line2 } from "./line2";

export const subLine = (line: Line2, alpha: number, beta: number): Line2 => {
    const a = line.a;
    const b = line.b;
    return {
        a: interpolate(line, alpha),
        b: interpolate(line, beta),
    };
}