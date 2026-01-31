import type { Volume } from "./volume.js";
import * as DenseVolumeNamespace from "../dense-volume/public.js";
import * as ColumnVolumeNamespace from "../column-volume/public.js";
import * as DenseVolumeIs from "../dense-volume/is.js";
import * as ColumnVolumeIs from "../column-volume/is.js";

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
    if (DenseVolumeIs.is(volume)) {
        return DenseVolumeNamespace.get(volume, x, y, z);
    }
    
    if (ColumnVolumeIs.is(volume)) {
        return ColumnVolumeNamespace.get(volume, x, y, z);
    }
    
    // TypeScript exhaustiveness check - this should never happen
    const _exhaustive: never = volume;
    throw new Error(`Unknown volume type: ${(_exhaustive as any).type}`);
};

