import { interpolate } from "./interpolate.js";
import { Line3 } from "./line3.js";

export const subLine = (line: Line3, alpha: number, beta: number): Line3 => {
    const a = line.a;
    const b = line.b;
    return {
        a: interpolate(line, alpha),
        b: interpolate(line, beta),
    };
} 