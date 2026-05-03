import type { Material } from "./material.js";

/**
 * ## Strain energy density (uniaxial bilinear σ–ε)
 *
 * Integrates **engineering stress in MPa** vs **engineering strain** along the same bilinear paths as
 * {@link ./youngs-modulus.ts}. Converts to **J/m³** via `MPa × strain × 10⁶` (since 1 MPa = 10⁶ Pa and
 * ∫ σ_Pa dε has units J/m³).
 *
 * **Tension** uses Q1 points; **compression** uses Q3 points. **Fluids / vacuum** (`[0,0]` curves) yield `0`.
 *
 * @module
 */

const strainEpsilon = 1e-12;

/** MPa × strain → J/m³ */
const mpaStrainToJoulesPerM3 = 1e6;

/**
 * Elastic strain energy density under **tensile** loading to yield: `½ σ_y ε_y` (J/m³).
 */
export const tensileElasticStrainEnergyDensity = (material: Material): number => {
    const [εy, σy] = material.tensileYieldStrainStress;
    if (εy <= strainEpsilon) {
        return 0;
    }
    return 0.5 * σy * εy * mpaStrainToJoulesPerM3;
};

/**
 * Elastic strain energy density under **compressive** loading to yield: `½ σ_y ε_y` (J/m³).
 * Both `ε_y` and `σ_y` are ≤ 0; the product is non‑negative.
 */
export const compressiveElasticStrainEnergyDensity = (material: Material): number => {
    const [εy, σy] = material.compressiveYieldStrainStress;
    if (εy >= -strainEpsilon) {
        return 0;
    }
    return 0.5 * σy * εy * mpaStrainToJoulesPerM3;
};

/**
 * **Plastic** strain energy density from tensile yield to tensile fracture (trapezoid under bilinear leg).
 */
export const tensilePlasticStrainEnergyDensity = (material: Material): number => {
    const [εy, σy] = material.tensileYieldStrainStress;
    const [εf, σf] = material.tensileFractureStrainStress;
    const dε = εf - εy;
    if (dε <= strainEpsilon) {
        return 0;
    }
    return dε * (σy + σf) * 0.5 * mpaStrainToJoulesPerM3;
};

/**
 * **Plastic** strain energy density from compressive yield to compressive fracture.
 */
export const compressivePlasticStrainEnergyDensity = (material: Material): number => {
    const [εy, σy] = material.compressiveYieldStrainStress;
    const [εf, σf] = material.compressiveFractureStrainStress;
    const dε = εf - εy;
    if (dε >= -strainEpsilon) {
        return 0;
    }
    return dε * (σy + σf) * 0.5 * mpaStrainToJoulesPerM3;
};

/** Total tensile strain energy density from zero strain to fracture (elastic + plastic). */
export const tensileStrainEnergyDensityToFracture = (material: Material): number =>
    tensileElasticStrainEnergyDensity(material) + tensilePlasticStrainEnergyDensity(material);

/** Total compressive strain energy density from zero strain to fracture (elastic + plastic). */
export const compressiveStrainEnergyDensityToFracture = (material: Material): number =>
    compressiveElasticStrainEnergyDensity(material) + compressivePlasticStrainEnergyDensity(material);

/**
 * Tensile strain energy density at **engineering strain** `strain` (≥ 0).
 *
 * **Clamp policy:** `strain` is clamped to `[0, ε_f]`. Negative input returns `0`. Strains beyond fracture
 * contribute no extra energy (saturated at {@link tensileStrainEnergyDensityToFracture}).
 */
export const tensileStrainEnergyDensityAtStrain = (material: Material, strain: number): number => {
    if (strain <= 0) {
        return 0;
    }
    const [εy, σy] = material.tensileYieldStrainStress;
    const [εf, σf] = material.tensileFractureStrainStress;
    if (εf <= strainEpsilon && εy <= strainEpsilon) {
        return 0;
    }
    const s = Math.min(strain, Math.max(εf, 0));
    if (s <= strainEpsilon) {
        return 0;
    }
    if (εy <= strainEpsilon) {
        return tensileStrainEnergyDensityToFracture(material);
    }
    if (s <= εy) {
        return 0.5 * (σy / εy) * s * s * mpaStrainToJoulesPerM3;
    }
    const uElastic = tensileElasticStrainEnergyDensity(material);
    const dεPl = s - εy;
    const dεTot = εf - εy;
    const σAt =
        dεTot > strainEpsilon ? σy + ((σf - σy) * dεPl) / dεTot : σy;
    return uElastic + dεPl * (σy + σAt) * 0.5 * mpaStrainToJoulesPerM3;
};

/**
 * Compressive strain energy density at **engineering strain** `strain` (≤ 0).
 *
 * **Clamp policy:** `strain` is clamped to `[ε_f, 0]`. Positive input returns `0`. Strains past compressive
 * fracture (more negative than `ε_f`) saturate at {@link compressiveStrainEnergyDensityToFracture}.
 */
export const compressiveStrainEnergyDensityAtStrain = (material: Material, strain: number): number => {
    if (strain >= 0) {
        return 0;
    }
    const [εy, σy] = material.compressiveYieldStrainStress;
    const [εf, σf] = material.compressiveFractureStrainStress;
    if (εf >= -strainEpsilon && εy >= -strainEpsilon) {
        return 0;
    }
    const s = Math.max(εf, Math.min(strain, 0));
    if (s >= -strainEpsilon) {
        return 0;
    }
    if (εy >= -strainEpsilon) {
        return compressiveStrainEnergyDensityToFracture(material);
    }
    if (s >= εy) {
        return 0.5 * (σy / εy) * s * s * mpaStrainToJoulesPerM3;
    }
    const uElastic = compressiveElasticStrainEnergyDensity(material);
    const dεPl = s - εy;
    const dεTot = εf - εy;
    const σAt =
        dεTot < -strainEpsilon ? σy + ((σf - σy) * dεPl) / dεTot : σy;
    return uElastic + dεPl * (σy + σAt) * 0.5 * mpaStrainToJoulesPerM3;
};
