import { Vec4 } from "@adobe/data/math";
import type { Rgba } from "./rgba.js";

export const toVec4 = (rgba: Rgba): Vec4 => {
    return [
        ((rgba >>> 0) & 0xFF) / 255,   // Red   - bits 0-7
        ((rgba >>> 8) & 0xFF) / 255,    // Green - bits 8-15
        ((rgba >>> 16) & 0xFF) / 255,   // Blue  - bits 16-23
        ((rgba >>> 24) & 0xFF) / 255    // Alpha - bits 24-31
    ];
};

