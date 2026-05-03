import type { Volume } from "./volume.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "../column-volume/column-volume.js";

/**
 * Gets the voxel value at the specified coordinates in a Volume.
 * Dispatches to the appropriate get function based on the volume type.
 * @param volume The Volume (DenseVolume or ColumnVolume) to get the voxel from
 * @param x X coordinate
 * @param y Y coordinate
 * @param z Z coordinate
 * @returns The voxel value, or null if coordinates are out of bounds or voxel doesn't exist
 */
export const get = <T>(
    volume: Volume<T>,
    x: number,
    y: number,
    z: number
): T | null => {
    if (DenseVolume.is(volume)) {
        return DenseVolume.get(volume, x, y, z);
    }
    
    if (ColumnVolume.is(volume)) {
        return ColumnVolume.get(volume, x, y, z);
    }
    
    // TypeScript exhaustiveness check - this should never happen
    const _exhaustive: never = volume;
    throw new Error(`Unknown volume type: ${(_exhaustive as any).type}`);
};

