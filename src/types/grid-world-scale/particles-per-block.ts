import type { GridWorldScale } from "./grid-world-scale.js";

export const particlesPerBlock = (scale: GridWorldScale) => scale.blockSize / scale.particleSize;
