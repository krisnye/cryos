// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { PhysicalVoxel } from "./physical-voxel.js";
import type { Unpacked } from "./unpack.js";
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

/**
 * Packs material state into a PhysicalVoxel u32 value.
 * Parameters are ordered low bits first with defaults of 0/false.
 * @param materialTypeId Material type ID, 0-4095 (bits 11-0)
 * @param temperature Temperature in Kelvin, 0-4095 (bits 23-12)
 * @param amountOrHealth Amount (sediment) or health (solid), 0-15 (bits 27-24)
 * @param bondZ Bond in positive z direction (bit 28)
 * @param bondY Bond in positive y direction (bit 29)
 * @param bondX Bond in positive x direction (bit 30)
 * @param sediment 1 = broken sediment, 0 = solid material (bit 31)
 * @returns Packed PhysicalVoxel value
 * @throws If any value is out of range
 */
export const pack = (
    materialTypeId = 0,
    temperature = 0,
    amountOrHealth = 0,
    bondZ = false,
    bondY = false,
    bondX = false,
    sediment = false
): PhysicalVoxel => {
    if (amountOrHealth < 0 || amountOrHealth > 15) {
        throw new Error(`Amount/health ${amountOrHealth} is out of range [0, 15]`);
    }
    if (temperature < 0 || temperature > 4095) {
        throw new Error(`Temperature ${temperature} is out of range [0, 4095]`);
    }
    if (materialTypeId < 0 || materialTypeId > 4095) {
        throw new Error(`Material type ID ${materialTypeId} is out of range [0, 4095]`);
    }
    return (
        (sediment ? 1 << SEDIMENT_SHIFT : 0) |
        ((bondX ? 1 : 0) << BOND_X_SHIFT) |
        ((bondY ? 1 : 0) << BOND_Y_SHIFT) |
        ((bondZ ? 1 : 0) << BOND_Z_SHIFT) |
        ((amountOrHealth & AMOUNT_OR_HEALTH_MASK) << AMOUNT_OR_HEALTH_SHIFT) |
        ((temperature & TEMPERATURE_MASK) << TEMPERATURE_SHIFT) |
        (materialTypeId & MATERIAL_TYPE_ID_MASK)
    );
};

/**
 * Repacks an Unpacked object into a PhysicalVoxel u32 value.
 * @param unpacked Unpacked material state
 * @returns Packed PhysicalVoxel value
 * @throws If any value is out of range
 */
export const repack = ({
    sediment,
    bondX,
    bondY,
    bondZ,
    amountOrHealth,
    temperature,
    materialTypeId,
}: Unpacked): PhysicalVoxel =>
    pack(materialTypeId, temperature, amountOrHealth, bondZ, bondY, bondX, sediment);
