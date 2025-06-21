import { StaticVoxel, toDebugStaticVoxel } from "./static-voxel.js";
import { StaticVoxelColumn, toDebugStaticVoxelColumn } from "./static-voxel-column.js";

export type StaticVoxelMapSize = number;

export const EmptyStaticVoxel = 0;

/**
 * A Static Voxel Map is packed with a size in index 0 followed by size * size columns and then voxels as many as needed.
 */
export type StaticVoxelMap = Uint32Array;

export const toDebugStaticVoxelMap = (map: StaticVoxelMap) => {
    const size = map[0];
    const columns = map.slice(1, 1 + size * size);
    const voxels = map.slice(1 + size * size);
    return { size, columns: [...columns].map(toDebugStaticVoxelColumn), voxels: [...voxels].map(toDebugStaticVoxel) };
}
