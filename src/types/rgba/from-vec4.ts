import { Vec4 } from "@adobe/data/math";
import type { Rgba } from "./rgba.js";

export const fromVec4 = (vec4: Vec4): Rgba => {
    return (vec4[0] * 255) << 0 | (vec4[1] * 255) << 8 | (vec4[2] * 255) << 16 | (vec4[3] * 255) << 24;
};

