import { materials } from "./basic-materials.js";

/**
 * Creates basic voxel materials from the base materials with a specified voxel size
 * @param voxelSideLength The side length of the voxel in meters
 * @returns An object that provides both array access and named property access to voxel materials
 */
export function createBasicVoxelMaterials(voxelSideLength: number) {
    const rawVoxelMaterials = materials.map(material => {
        const volume = voxelSideLength ** 3; // m³
        const mass = material.density * volume; // kg
        const heatCapacity = material.specificHeatCapacity * mass; // J/K
        const thermalConductance = material.thermalConductivity * voxelSideLength; // W/K
        
        return {
            phase: material.phase,
            color: material.color,
            mass,
            viscosity: material.viscosity,
            heatCapacity,
            thermalConductance,
        };
    });

    // Derive the type from the const assertion
    type RawVoxelMaterial = typeof rawVoxelMaterials[number];
    type BasicVoxelMaterials = readonly RawVoxelMaterial[] & {
        [K in keyof typeof materials]: RawVoxelMaterial;
    };

    // Create the voxel materials object that satisfies both array and named property access
    const voxelMaterials: BasicVoxelMaterials = Object.assign([...rawVoxelMaterials], {} as any);

    // Add named properties for each material
    const materialNames = Object.keys(materials) as (keyof typeof materials)[];
    for (let i = 0; i < materialNames.length; i++) {
        (voxelMaterials as any)[materialNames[i]] = rawVoxelMaterials[i];
    }

    return voxelMaterials;
} 