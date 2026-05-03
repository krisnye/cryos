import type { Material } from "./material.js";

/**
 * ## Uniaxial bilinear stress–strain model (Cryos `Material`)
 *
 * Each solid uses **four `Vec2` points** in **engineering strain** vs **engineering stress (MPa)**:
 * - **Tension (Q1):** origin → {@link Material.tensileYieldStrainStress} → {@link Material.tensileFractureStrainStress}, both components ≥ 0.
 * - **Compression (Q3):** origin → {@link Material.compressiveYieldStrainStress} → {@link Material.compressiveFractureStrainStress}, both components ≤ 0.
 *
 * **Elastic segment:** straight line from `(0,0)` to the **yield** point. **Young’s modulus** in that mode is
 * `E = σ_yield / ε_yield` (slope). **No damage** is assumed while strain stays on that segment.
 *
 * **Post-yield segment:** straight line from yield to **fracture** (simplifies hardening + necking + break). **σ at fracture
 * can be below tensile σ at yield** under engineering stress (necking).
 *
 * **Fluids / vacuum:** yield and fracture points are `[0,0]`; modulus helpers return `0`.
 *
 * This is a **1D phenomenological** model (not shear, not triaxial). Wood/composites are **isotropic proxies** unless extended later.
 *
 * @module
 */

const strainEpsilon = 1e-12;

/**
 * Young’s modulus **E** implied by the **tensile elastic** line: slope from `(0,0)` to `material.tensileYieldStrainStress`.
 *
 * - **Units:** MPa (because stress is MPa and strain is dimensionless).
 * - **Formula:** `σ_y⁺ / ε_y⁺` when `|ε_y⁺| > ε_cutoff`, else `0`.
 * - **Use when:** you need stiffness in **tension / extension** consistent with the stored bilinear curve, e.g. elastic energy density `½ E ε²` below yield.
 */
export function youngsModulusTension(
    material: Pick<Material, "tensileYieldStrainStress">,
): number {
    const [strain, stress] = material.tensileYieldStrainStress;
    if (Math.abs(strain) < strainEpsilon) {
        return 0;
    }
    return stress / strain;
}

/**
 * Young’s modulus **E** implied by the **compressive elastic** line: slope from `(0,0)` to `material.compressiveYieldStrainStress`.
 *
 * - **Units:** MPa. Both strain and stress are **negative** in Q3; their ratio **σ/ε is positive** (same as tensile E for a symmetric metal).
 * - **Formula:** `σ_y⁻ / ε_y⁻` when `|ε_y⁻| > ε_cutoff`, else `0`.
 * - **Use when:** you need stiffness under **uniaxial compression** along the modeled axis (not buckling, not confined triaxial).
 */
export function youngsModulusCompression(
    material: Pick<Material, "compressiveYieldStrainStress">,
): number {
    const [strain, stress] = material.compressiveYieldStrainStress;
    if (Math.abs(strain) < strainEpsilon) {
        return 0;
    }
    return stress / strain;
}
