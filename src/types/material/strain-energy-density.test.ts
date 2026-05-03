import { describe, expect, it } from "vitest";
import { definitions } from "./definitions.js";
import {
    compressiveElasticStrainEnergyDensity,
    compressivePlasticStrainEnergyDensity,
    compressiveStrainEnergyDensityAtStrain,
    compressiveStrainEnergyDensityToFracture,
    tensileElasticStrainEnergyDensity,
    tensilePlasticStrainEnergyDensity,
    tensileStrainEnergyDensityAtStrain,
    tensileStrainEnergyDensityToFracture,
} from "./strain-energy-density.js";

describe("strain-energy-density", () => {
    const steel = definitions.steel;
    const air = definitions.air;

    it("fluids: all densities are zero", () => {
        expect(tensileElasticStrainEnergyDensity(air)).toBe(0);
        expect(compressiveElasticStrainEnergyDensity(air)).toBe(0);
        expect(tensilePlasticStrainEnergyDensity(air)).toBe(0);
        expect(compressivePlasticStrainEnergyDensity(air)).toBe(0);
        expect(tensileStrainEnergyDensityToFracture(air)).toBe(0);
        expect(compressiveStrainEnergyDensityToFracture(air)).toBe(0);
        expect(tensileStrainEnergyDensityAtStrain(air, 0.1)).toBe(0);
        expect(compressiveStrainEnergyDensityAtStrain(air, -0.1)).toBe(0);
    });

    it("steel tensile elastic matches ½ σ_y ε_y in J/m³", () => {
        const [εy, σy] = steel.tensileYieldStrainStress;
        const expected = 0.5 * σy * εy * 1e6;
        expect(tensileElasticStrainEnergyDensity(steel)).toBeCloseTo(expected, 6);
    });

    it("steel tensile plastic is trapezoid (ε_f − ε_y)(σ_y + σ_f)/2 × 10⁶", () => {
        const [εy, σy] = steel.tensileYieldStrainStress;
        const [εf, σf] = steel.tensileFractureStrainStress;
        const expected = (εf - εy) * (σy + σf) * 0.5 * 1e6;
        expect(tensilePlasticStrainEnergyDensity(steel)).toBeCloseTo(expected, 3);
    });

    it("steel tensile total equals elastic + plastic", () => {
        const u =
            tensileElasticStrainEnergyDensity(steel) + tensilePlasticStrainEnergyDensity(steel);
        expect(tensileStrainEnergyDensityToFracture(steel)).toBeCloseTo(u, 4);
    });

    it("tensile atStrain: midpoint in plastic segment matches manual trapezoid slice", () => {
        const [εy, σy] = steel.tensileYieldStrainStress;
        const [εf, σf] = steel.tensileFractureStrainStress;
        const mid = εy + 0.5 * (εf - εy);
        const σMid = σy + 0.5 * (σf - σy);
        const uElastic = tensileElasticStrainEnergyDensity(steel);
        const uSlice = 0.5 * (εf - εy) * 0.5 * (σy + σMid) * 1e6;
        const expected = uElastic + uSlice;
        expect(tensileStrainEnergyDensityAtStrain(steel, mid)).toBeCloseTo(expected, 2);
    });

    it("tensile atStrain clamps beyond fracture", () => {
        const uMax = tensileStrainEnergyDensityToFracture(steel);
        expect(tensileStrainEnergyDensityAtStrain(steel, 1e6)).toBeCloseTo(uMax, 4);
    });

    it("compressive atStrain clamps beyond fracture", () => {
        const uMax = compressiveStrainEnergyDensityToFracture(steel);
        expect(compressiveStrainEnergyDensityAtStrain(steel, -1e6)).toBeCloseTo(uMax, 4);
    });
});
