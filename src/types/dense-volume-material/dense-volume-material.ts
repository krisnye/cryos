import { DenseVolume } from "../dense-volume/dense-volume.js";
import { PhysicalVoxel } from "../physical-voxel/physical-voxel.js";

/**
 * A dense volume containing PhysicalVoxel (packed material state).
 * Compatible with raw material IDs when sediment=false, temperature=0, no bonds.
 */
export type DenseVolumeMaterial = DenseVolume<PhysicalVoxel>;

export * as DenseVolumeMaterial from "./public.js";
