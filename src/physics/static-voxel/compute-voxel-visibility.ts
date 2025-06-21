import { StaticVoxel } from "./static-voxel.js";
import { StaticVoxelMap } from "./static-voxel-map.js";

/**
 * Iterates every voxel in every column of the map.
 * If every voxel around it is opaque then the voxel is invisible.
 */
export const computeVoxelVisibility = (map: StaticVoxelMap, isOpaque: (voxel: StaticVoxel) => boolean) => {
}