import { F32, Vec3, Vec4 } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";

export const schema = {
    type: "object",
    layout: "std140",
    properties: {
        // main base color vec4
        baseColor: Vec4.schema,

        // metallic, roughness, irReflectance, irEmission
        metallic: { ...F32.schema, minimum: 0, maximum: 1 },
        roughness: { ...F32.schema, minimum: 0, maximum: 1 },
        irReflectance: { ...F32.schema, minimum: 0, maximum: 1 },
        irEmission: { ...F32.schema, minimum: 0, maximum: 1 },

        // emission, vec4
        emissionRgb: Vec3.schema,
        // 0: uv flourescence, 1: visible luminescence
        emissionMode: { ...F32.schema, minimum: 0, maximum: 1 },

        // physical properties
        // Density in kg/m³ (kilograms per cubic meter)
        density: F32.schema,
        // Viscosity in Pa·s (Pascal-seconds)
        viscosity: F32.schema,
        // Specific heat capacity in J/(kg·K) (Joules per kilogram per Kelvin)
        specificHeatCapacity: F32.schema,
        // Thermal conductivity in W/(m·K) (Watts per meter per Kelvin)
        thermalConductivity: F32.schema,
    },
    required: ["baseColor", "metallic", "roughness", "irReflectance", "irEmission", "emissionRgb", "emissionMode", "density", "viscosity", "specificHeatCapacity", "thermalConductivity"],
} as const satisfies Schema;