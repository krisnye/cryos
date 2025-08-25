import { Material } from "./material.js";

const rawMaterials = [
    {
        name: "air",
        phase: "gas",
        color: [1.0, 1.0, 1.0, 0.01],
        density: 0.001225,
        viscosity: 0,
        specificHeatCapacity: 1006.0,
        thermalConductivity: 0.024,
    },
    {
        name: "water",
        phase: "liquid",
        color: [0.0, 0.0, 1.0, 0.1],
        density: 0.997,
        viscosity: 1.0,
        specificHeatCapacity: 4200.0,
        thermalConductivity: 0.66,
    },
    {
        name: "rock",
        phase: "solid",
        color: [0.5, 0.5, 0.5, 1.0],
        density: 2.65,
        viscosity: 0,
        specificHeatCapacity: 800.0,
        thermalConductivity: 4.0,
    },
    {
        name: "ice",
        phase: "solid",
        color: [0.8, 0.8, 1.0, 0.5],
        density: 0.997,
        viscosity: 0,
        specificHeatCapacity: 2040.0,
        thermalConductivity: 2.18,
    },
    {
        name: "iron",
        phase: "solid",
        color: [0.7, 0.7, 0.7, 1.0],
        density: 7.874,
        viscosity: 0,
        specificHeatCapacity: 460.0,
        thermalConductivity: 50.0,
    },
    {
        name: "dirt",
        phase: "solid",
        color: [0.4, 0.3, 0.2, 1.0],
        density: 1.51,
        viscosity: 0,
        specificHeatCapacity: 800.0,
        thermalConductivity: 0.25,
    },
    {
        name: "sand",
        phase: "grain",
        color: [0.9, 0.8, 0.6, 1.0],
        density: 2.1,
        viscosity: 0,
        specificHeatCapacity: 830.0,
        thermalConductivity: 0.2,
    },
    {
        name: "woodHard",
        phase: "solid",
        color: [0.6, 0.4, 0.2, 1.0],
        density: 0.65,
        viscosity: 0,
        specificHeatCapacity: 2000.0,
        thermalConductivity: 0.16,
    },
    {
        name: "woodSoft",
        phase: "solid",
        color: [0.7, 0.5, 0.3, 1.0],
        density: 0.49,
        viscosity: 0,
        specificHeatCapacity: 2300.0,
        thermalConductivity: 0.12,
    },
    {
        name: "infiniteHeatCapacity",
        phase: "solid",
        color: [1.0, 1.0, 1.0, 1.0],
        density: 10.0,
        viscosity: 0,
        specificHeatCapacity: Number.POSITIVE_INFINITY,
        thermalConductivity: 100.0,
    },
] as const satisfies Material[];

// Derive the type from the const assertion
type RawMaterial = typeof rawMaterials[number];
type BasicMaterials = readonly RawMaterial[] & {
    [K in RawMaterial['name']]: Extract<RawMaterial, { name: K }>;
};

// Create the materials object that satisfies both array and named property access
export const materials: BasicMaterials = Object.assign([...rawMaterials], {} as any);

for (const material of rawMaterials) {
    (materials as any)[material.name] = material;
}

