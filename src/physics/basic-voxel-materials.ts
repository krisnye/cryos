import { materials } from "./basic-materials.js";

// Derive the type from the const assertion
type RawVoxelMaterial = {
    index: number;
    phase: string;
    color: readonly [number, number, number, number];
    mass: number;
    viscosity: number;
    heatCapacity: number;
    thermalConductance: number;
};

export type BasicVoxelMaterials = readonly RawVoxelMaterial[] & {
    [K in keyof typeof materials]: RawVoxelMaterial;
};

/**
 * Creates basic voxel materials from the base materials with a specified voxel size
 * @param voxelSideLength The side length of the voxel in meters
 * @returns An object that provides both array access and named property access to voxel materials
 */
export function createBasicVoxelMaterials(voxelSideLength: number): BasicVoxelMaterials {
    const rawVoxelMaterials = materials.map(material => {
        const volume = voxelSideLength ** 3; // m³
        const mass = material.density * volume; // kg
        const heatCapacity = material.specificHeatCapacity * mass; // J/K
        const thermalConductance = material.thermalConductivity * voxelSideLength; // W/K
        
        return {
            index: material.index,
            phase: material.phase,
            color: material.color,
            mass,
            viscosity: material.viscosity,
            heatCapacity,
            thermalConductance,
        };
    });

    // Create the voxel materials object that satisfies both array and named property access
    const voxelMaterials: BasicVoxelMaterials = Object.assign([...rawVoxelMaterials], {} as any);

    // Add named properties for each material using the material names
    for (let i = 0; i < rawVoxelMaterials.length; i++) {
        const materialName = materials[i].name;
        (voxelMaterials as any)[materialName] = rawVoxelMaterials[i];
    }

    return voxelMaterials;
} 