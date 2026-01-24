import { Vec3 } from "@adobe/data/math";
import type { DenseVolume } from "./dense-volume.js";
import type { Volume } from "../volume.js";

export { equals } from "./equals.js";

export type Index = number;

/**
 * Type guard to check if a volume is a DenseVolume.
 * @param volume The volume to check
 * @returns True if the volume is a DenseVolume
 */
export const is = <T>(volume: Volume<T>): volume is DenseVolume<T> => {
    return volume.type === "dense";
};

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

export const create = <T>(volume: Omit<DenseVolume<T>, "type">): DenseVolume<T> => {
    return {
        type: "dense",
        ...volume,
    };
};

