import type { Rgba } from "./rgba.js";

export const isVisible = (rgba: Rgba): boolean => {
    return ((rgba >>> 24) & 0xFF) !== 0; // Alpha is in highest 8 bits, visible if non-zero
};

