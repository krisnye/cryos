import type { Vec2, Vec3, Vec4 } from "@adobe/data/math";

/**
 * GPU (WGSL host-shareable) material record: rendering, thermophysical, and mechanical fields.
 * Field order matches {@link ./schema.ts} for typed-buffer layout.
 *
 * ## Mechanics (uniaxial bilinear σ–ε)
 * See {@link ./youngs-modulus.ts} and {@link ./strain-energy-density.ts} for modulus and strain‑energy helpers.
 * Each `Vec2` is **`[engineering strain, stress in MPa]`**. Tension lives in Q1 (non‑negative),
 * compression in Q3 (non‑positive). Elastic line is `(0,0)` → yield; post‑yield is yield → fracture.
 */
export type Material = {
    /**
     * Linear RGBA albedo and alpha (alpha = opacity; 0 = fully transparent).
     * Components are typically in [0, 1]; alpha may be used for blending.
     */
    readonly baseColor: Vec4;

    /**
     * Metallic factor for PBR (0 = dielectric, 1 = metal).
     * range [0, 1].
     */
    readonly metallic: number;

    /**
     * Perceptual roughness for PBR (0 = smooth, 1 = rough).
     * range [0, 1].
     */
    readonly roughness: number;

    /**
     * Infrared reflectance factor.
     * range [0, 1].
     */
    readonly irReflectance: number;

    /**
     * Infrared emission strength (shader/material tuning).
     * range [0, 1].
     */
    readonly irEmission: number;

    /**
     * Linear RGB emission color (strength interpreted with emission mode).
     * Components dimensionless; typically in [0, 1].
     */
    readonly emissionRgb: Vec3;

    /**
     * Emission mode: `0` = UV fluorescence, `1` = visible luminescence.
     * range [0, 1].
     */
    readonly emissionMode: number;

    /**
     * Mass density.
     * Units: kg/m³ (kilograms per cubic meter).
     */
    readonly density: number;

    /**
     * Dynamic viscosity.
     * Units: Pa·s (Pascal-seconds).
     */
    readonly viscosity: number;

    /**
     * Specific heat capacity at constant pressure (model constant).
     * Units: J/(kg·K) (joules per kilogram per kelvin).
     * May be `Infinity` where the model treats heat capacity as unbounded (e.g. meta materials).
     */
    readonly specificHeatCapacity: number;

    /**
     * Thermal conductivity.
     * Units: W/(m·K) (watts per meter per kelvin).
     */
    readonly thermalConductivity: number;

    /**
     * Tensile yield: `[ε_y, σ_y]` in Q1 (both ≥ 0). Elastic segment `(0,0)`→here; slope is tensile Young’s modulus.
     */
    readonly tensileYieldStrainStress: Vec2;

    /**
     * Tensile fracture: `[ε_f, σ_f]` in Q1 (both ≥ 0). Post‑yield segment from tensile yield to here.
     * Engineering stress at fracture may be **below** yield stress (necking).
     */
    readonly tensileFractureStrainStress: Vec2;

    /**
     * Compressive yield: `[ε_y, σ_y]` in Q3 (both ≤ 0).
     */
    readonly compressiveYieldStrainStress: Vec2;

    /**
     * Compressive fracture / crush limit: `[ε_f, σ_f]` in Q3 (both ≤ 0).
     */
    readonly compressiveFractureStrainStress: Vec2;

    /**
     * Normal-direction coefficient of restitution for impacts.
     * range [0, 1] (0 = no bounce, 1 = perfectly elastic).
     */
    readonly restitution: number;
};

export * as Material from "./public.js";
