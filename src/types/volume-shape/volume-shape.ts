import type { DenseVolume } from "../dense-volume/dense-volume.js";
import type { Voxel } from "./voxel/voxel.js";

/**
 * Dense volume whose voxel payload uses {@link Voxel}.
 */
export type VolumeShape = DenseVolume<Voxel>;

export * as VolumeShape from "./public.js";
