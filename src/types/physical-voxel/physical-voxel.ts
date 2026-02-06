/**
 * PhysicalVoxel is a u32 value that packs material state for a single voxel cell:
 * - Bit 31: sediment flag (1 = broken sediment, 0 = solid material)
 * - Bits 30-28: x, y, z bonds in positive direction
 * - Bits 27-24: amount (sediment) or health (solid), 0-15
 * - Bits 23-12: temperature in Kelvin, 0-4095
 * - Bits 11-0: material type ID, 0-4095
 */
export type PhysicalVoxel = number;

export * as PhysicalVoxel from "./public.js";
