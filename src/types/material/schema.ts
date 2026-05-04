import { F32, Vec2, Vec3, Vec4 } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import type { Assert, Equal } from "@adobe/data/types";
import type { Material } from "./material.js";

/**
 * Material struct layout for TypedBuffer / GPU storage. The matching WGSL `Material` struct
 * must list the same fields in the same order; `getStructLayout` uses WGSL host-shareable
 * rules so the host bytes line up with `array<Material>` in `var<storage>` automatically.
 */
export const schema = {
    type: "object",
    layout: "storage",
    properties: {
        baseColor: Vec4.schema,

        metallic: { ...F32.schema, minimum: 0, maximum: 1 },
        roughness: { ...F32.schema, minimum: 0, maximum: 1 },
        irReflectance: { ...F32.schema, minimum: 0, maximum: 1 },
        irEmission: { ...F32.schema, minimum: 0, maximum: 1 },

        emissionRgb: Vec3.schema,
        emissionMode: { ...F32.schema, minimum: 0, maximum: 1 },

        density: F32.schema,
        viscosity: F32.schema,
        specificHeatCapacity: F32.schema,
        thermalConductivity: F32.schema,

        tensileYieldStrainStress: Vec2.schema,
        tensileFractureStrainStress: Vec2.schema,
        compressiveYieldStrainStress: Vec2.schema,
        compressiveFractureStrainStress: Vec2.schema,

        restitution: { ...F32.schema, minimum: 0, maximum: 1 },
    },
    required: [
        "baseColor",
        "metallic",
        "roughness",
        "irReflectance",
        "irEmission",
        "emissionRgb",
        "emissionMode",
        "density",
        "viscosity",
        "specificHeatCapacity",
        "thermalConductivity",
        "tensileYieldStrainStress",
        "tensileFractureStrainStress",
        "compressiveYieldStrainStress",
        "compressiveFractureStrainStress",
        "restitution",
    ],
} as const satisfies Schema;

type _MaterialMatchesSchema = Assert<Equal<Material, Schema.ToType<typeof schema>>>;
