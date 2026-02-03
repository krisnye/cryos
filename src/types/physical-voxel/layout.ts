// © 2026 Adobe. MIT License. See /LICENSE for details.
// PhysicalVoxel bit layout (bits 31→0): sediment(31) | bondX(30) bondY(29) bondZ(28) | amount/health(27-24) | temperature(23-12) | materialTypeId(11-0)
// Not publicly exported; use via pack, unpack, getMaterialId.

/** Bit position for materialTypeId (bits 11-0). */
export const MATERIAL_TYPE_ID_SHIFT = 0;
/** Bit position for temperature (bits 23-12). */
export const TEMPERATURE_SHIFT = 12;
/** Bit position for amountOrHealth (bits 27-24). */
export const AMOUNT_OR_HEALTH_SHIFT = 24;
/** Bit position for bondZ (bit 28). */
export const BOND_Z_SHIFT = 28;
/** Bit position for bondY (bit 29). */
export const BOND_Y_SHIFT = 29;
/** Bit position for bondX (bit 30). */
export const BOND_X_SHIFT = 30;
/** Bit position for sediment (bit 31). */
export const SEDIMENT_SHIFT = 31;

/** Mask for materialTypeId (12 bits, 0-4095). */
export const MATERIAL_TYPE_ID_MASK = 0xfff;
/** Mask for temperature (12 bits, 0-4095). */
export const TEMPERATURE_MASK = 0xfff;
/** Mask for amountOrHealth (4 bits, 0-15). */
export const AMOUNT_OR_HEALTH_MASK = 0xf;
