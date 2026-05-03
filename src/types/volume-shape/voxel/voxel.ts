/**
 * Packed flags for each voxel in a volume shape (see `VolumeShape`).
 *
 * Bit layout:
 * - Bits 0–5 — which faces of the volume AABB this voxel touches; **same bit positions as** `Aabb.Face`
 *   (use `Aabb.Face.POS_Z`, `NEG_X`, etc. when reading or writing those adjacency flags).
 * - Bit 6 — `Voxel.FULL`: cell is filled vs empty.
 * - Bit 7 — `Voxel.INTERIOR`: all six orthogonal neighbors are filled.
 */
export type Voxel = number;

export * as Voxel from "./public.js";
