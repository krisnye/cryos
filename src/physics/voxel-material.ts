import { Material, MaterialIndex } from "./material.js";
import { Phase } from "./phase.js";
import { Vec4 } from "@adobe/data/math";

export type VoxelMaterial = {
    phase: Phase;
    index: MaterialIndex;
    meta: boolean;
    color: Vec4;
    /** Mass of the voxel in kg */
    mass: number;
    /** Viscosity in Pa·s (Pascal-seconds) - remains the same as it's a material property */
    viscosity: number;
    /** Heat capacity of the voxel in J/K (Joules per Kelvin) */
    heatCapacity: number;
    /** Thermal conductance in W/K (Watts per Kelvin) - how much heat flows through the voxel per degree difference */
    thermalConductance: number;
}

/**
 * Converts a Material to a VoxelMaterial for a given voxel size
 * @param material The base material with intensive properties
 * @param voxelSideLength The side length of the voxel in meters
 * @returns A VoxelMaterial with extensive properties calculated for the voxel size
 */
export function createVoxelMaterial(material: Material, voxelSideLength: number): VoxelMaterial {
    const volume = voxelSideLength ** 3; // m³
    const mass = material.density * volume; // kg
    const heatCapacity = material.specificHeatCapacity * mass; // J/K
    const thermalConductance = material.thermalConductivity * voxelSideLength; // W/K
    
    return {
        phase: material.phase,
        index: material.index,
        meta: material.meta ?? false,
        color: material.color,
        mass,
        viscosity: material.viscosity,
        heatCapacity,
        thermalConductance,
    };
} 