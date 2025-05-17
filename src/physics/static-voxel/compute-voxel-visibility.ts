import { StaticVoxel } from "./static-voxel";
import { StaticVoxelMap } from "./static-voxel-map";

/**
 * Iterates every voxel in every column of the map.
 * If every voxel around it is opaque then the voxel is invisible.
 */
export const computeVoxelVisibility = (map: StaticVoxelMap, isOpaque: (voxel: StaticVoxel) => boolean) => {
}