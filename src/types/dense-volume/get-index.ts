
import type { DenseVolume } from "./dense-volume.js";
import type { Index } from "./index-type.js";

/**
 * Get the index of a voxel in a dense volume.
 * @param volume 
 * @param x 
 * @param y 
 * @param z 
 * @returns The index of the voxel.
 */
export const getIndex = <T>(volume: DenseVolume<T>, x: number, y: number, z: number): Index => {
    const [width, height] = volume.size;
    return x + width * (y + z * height);
};

