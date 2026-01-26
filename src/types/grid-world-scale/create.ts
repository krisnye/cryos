import type { GridWorldScale } from "./grid-world-scale.js";

export const create = (scale: Partial<GridWorldScale>): GridWorldScale => {
    const {
        particleSize = 0.25,
        blockSize = particleSize * 16,
        chunkSize = blockSize * 16
    } = scale;
    return { particleSize, blockSize, chunkSize };
};

