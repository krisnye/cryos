// © 2026 Adobe. MIT License. See /LICENSE for details.
import type { ColumnVolume } from "./column-volume.js";

export type Index = number;

/**
 * Get the tile index of a voxel in a column volume.
 * @param volume
 * @param x
 * @param y
 * @returns The tile index of the voxel.
 */
export const tileIndex = <T>(volume: ColumnVolume<T>, x: number, y: number): Index => {
    const [width] = volume.size;
    return x + width * y;
};

