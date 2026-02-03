// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { Material } from "./material.js";
import { materials } from "./materials.js";

/**
 * Luminance of RGB (0-1) using standard weights.
 * Lower = darker = absorbs more solar radiation.
 */
function luminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function estimateForMaterial(
    material: Material,
    ambientTemperatureKelvin: number,
    solarExposure: number
): number {
    const { baseColor, irReflectance, irEmission, metallic } = material;

    // Solar absorptivity: (1 - reflectance) × dark factor
    // Dark materials (low luminance) absorb more
    const baseAbsorptivity = 1 - irReflectance;
    const lum = luminance(baseColor[0], baseColor[1], baseColor[2]);
    const darkFactor = 1 + 0.25 * (1 - lum); // dark materials get +25% absorption
    const absorptivity = Math.min(baseAbsorptivity * darkFactor, 1);

    // Thermal emissivity: how well it radiates heat away
    // When irEmission is 0 (unspecified), metals typically have lower ε
    const emissivity =
        irEmission > 0 ? irEmission : metallic > 0.5 ? 0.5 : 0.9;
    const epsilon = Math.max(emissivity, 0.1); // avoid division by zero

    // Equilibrium factor: high absorption / low emission = hotter
    const equilibriumFactor = absorptivity / epsilon;

    // ΔT scales with solar exposure and equilibrium factor
    // Full sun (1.0), factor ~1 → ~25 K above ambient
    const maxDeltaK = 80; // cap to avoid unrealistic values
    const deltaK = Math.min(
        solarExposure * 25 * Math.min(equilibriumFactor, 2.5),
        maxDeltaK
    );

    return ambientTemperatureKelvin + deltaK;
}

/**
 * Estimates surface temperature for a material in sunlight.
 * Uses a simplified steady-state model: absorption vs emission.
 *
 * @param materialOrId - The material object or Material.Id to estimate temperature for
 * @param ambientTemperatureKelvin - Ambient air temperature in Kelvin (e.g. 298 for 25°C)
 * @param solarExposure - Solar radiation exposure, 0-1 normalized (1 = full direct sun, ~1000 W/m²)
 * @returns Estimated surface temperature in Kelvin
 *
 * @remarks
 * Uses current material properties:
 * - irReflectance: lower = absorbs more (α ≈ 1 - irReflectance)
 * - baseColor: darker colors absorb more (luminance factor)
 * - irEmission: lower = radiates less, stays hotter (ε; defaults from metallic when 0)
 * - metallic: when irEmission is 0, metals get lower default emissivity
 *
 * Extensible for future properties (thermal conductivity, convection, etc.)
 */
export const estimateTemperature = (
    materialOrId: Material | number,
    ambientTemperatureKelvin: number,
    solarExposure: number
): number => {
    const material =
        typeof materialOrId === "number"
            ? materials[materialOrId]
            : materialOrId;
    if (!material) {
        return ambientTemperatureKelvin; // invalid ID: no heating
    }
    return estimateForMaterial(
        material,
        ambientTemperatureKelvin,
        solarExposure
    );
};
