// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { PhysicalVoxel } from "./physical-voxel.js";
import { MATERIAL_TYPE_ID_MASK } from "./layout.js";

/** Mask for material type ID (low 12 bits). Re-exported for consumers that need the raw mask. */
export const materialIdMask = MATERIAL_TYPE_ID_MASK;

/**
 * Extracts material type ID from a PhysicalVoxel (low 12 bits).
 * @param physicalVoxel Packed PhysicalVoxel value
 * @returns Material type ID, 0-4095
 */
export const getMaterialId = (physicalVoxel: PhysicalVoxel): number =>
    physicalVoxel & materialIdMask;
