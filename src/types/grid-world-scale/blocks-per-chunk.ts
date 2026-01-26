import type { GridWorldScale } from "./grid-world-scale.js";

export const blocksPerChunk = (scale: GridWorldScale) => scale.chunkSize / scale.blockSize;

