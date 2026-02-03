// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { PhysicalVoxel } from "./physical-voxel.js";
import {
    AMOUNT_OR_HEALTH_MASK,
    AMOUNT_OR_HEALTH_SHIFT,
    BOND_X_SHIFT,
    BOND_Y_SHIFT,
    BOND_Z_SHIFT,
    MATERIAL_TYPE_ID_MASK,
    SEDIMENT_SHIFT,
    TEMPERATURE_MASK,
    TEMPERATURE_SHIFT,
} from "./layout.js";

/** Unpacked material state from a PhysicalVoxel. */
export type Unpacked = {
    sediment: boolean;
    bondX: boolean;
    bondY: boolean;
    bondZ: boolean;
    amountOrHealth: number;
    temperature: number;
    materialTypeId: number;
};

/**
 * Unpacks a PhysicalVoxel u32 value into its components.
 * @param physicalVoxel Packed PhysicalVoxel value
 * @returns Object with sediment, bondX, bondY, bondZ, amountOrHealth, temperature, materialTypeId
 */
export const unpack = (physicalVoxel: PhysicalVoxel): Unpacked => ({
    sediment: (physicalVoxel >>> SEDIMENT_SHIFT) === 1,
    bondX: ((physicalVoxel >>> BOND_X_SHIFT) & 1) === 1,
    bondY: ((physicalVoxel >>> BOND_Y_SHIFT) & 1) === 1,
    bondZ: ((physicalVoxel >>> BOND_Z_SHIFT) & 1) === 1,
    amountOrHealth: (physicalVoxel >>> AMOUNT_OR_HEALTH_SHIFT) & AMOUNT_OR_HEALTH_MASK,
    temperature: (physicalVoxel >>> TEMPERATURE_SHIFT) & TEMPERATURE_MASK,
    materialTypeId: physicalVoxel & MATERIAL_TYPE_ID_MASK,
});
