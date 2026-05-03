import type { ColumnVolume } from "./column-volume.js";
import { tileIndex } from "./tile-index.js";
import { ColumnInfo } from "./column-info/column-info.js";

/**
 * Gets the voxel value at the specified coordinates in a ColumnVolume.
 * @param volume The ColumnVolume to get the voxel from
 * @param x X coordinate
 * @param y Y coordinate
 * @param z Z coordinate
 * @returns The voxel value, or null if coordinates are out of bounds or voxel doesn't exist
 */
export const get = <T>(volume: ColumnVolume<T>, x: number, y: number, z: number): T | null => {
    const [width, height, depth] = volume.size;
    
    // Check bounds
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
        return null;
    }
    
    // Get column info for this (x, y) position
    const tileIdx = tileIndex(volume, x, y);
    const columnInfoPacked = volume.tile[tileIdx];
    
    // If column doesn't exist, return null
    if (columnInfoPacked === 0) {
        return null;
    }
    
    // Unpack column metadata
    const { dataOffset, length, zStart } = ColumnInfo.unpack(columnInfoPacked);
    
    // Calculate relative z position within the column
    const relativeZ = z - zStart;
    
    // Check if voxel exists in this column (relativeZ must be in [0, length))
    if (relativeZ < 0 || relativeZ >= length) {
        return null;
    }
    
    // Get voxel from column data
    return volume.data.get(dataOffset + relativeZ);
};

