import { Vec3 } from "@adobe/data/math";
import type { DenseVolume } from "./dense-volume.js";

export * from "./equals.js";

export type Index = number;

/**
 * Get the index of a voxel in a dense volume.
 * @param volume 
 * @param x 
 * @param y 
 * @param z 
 * @returns The index of the voxel.
 */
export const index = <T>(volume: DenseVolume<T>, x: number, y: number, z: number): Index => {
    const [width, height] = volume.size;
    return x + width * (y + z * height);
};

export const coordinates = <T>(volume: DenseVolume<T>, index: Index): Vec3 => {
    const [width, height] = volume.size;
    const z = Math.floor(index / (width * height));
    const y = Math.floor((index % (width * height)) / width);
    const x = index % width;
    return [x, y, z];
};

export const create = <T>(volume: DenseVolume<T>): DenseVolume<T> => {
    return volume;
};

