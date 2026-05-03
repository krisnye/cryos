import { describe, expect, test } from "vitest";
import { Material } from "./material.js";

const assertVec2Finite = (v: readonly [number, number]) => {
    expect(Number.isFinite(v[0])).toBe(true);
    expect(Number.isFinite(v[1])).toBe(true);
};

describe("Material definitions consistency", () => {
    test("uses coherent units and bilinear stress–strain invariants", () => {
        Material.materials.forEach((material, id) => {
            const name = Material.getName(id) ?? `unknown-${id}`;

            if (name !== "air") {
                expect(material.density).toBeGreaterThanOrEqual(100);
            }
            expect(material.density).toBeGreaterThan(0);
            expect(material.viscosity).toBeGreaterThanOrEqual(0);
            expect(material.specificHeatCapacity).toBeGreaterThan(0);
            expect(material.thermalConductivity).toBeGreaterThanOrEqual(0);

            assertVec2Finite(material.tensileYieldStrainStress);
            assertVec2Finite(material.tensileFractureStrainStress);
            assertVec2Finite(material.compressiveYieldStrainStress);
            assertVec2Finite(material.compressiveFractureStrainStress);
            expect(Number.isFinite(material.restitution)).toBe(true);
            expect(material.restitution).toBeGreaterThanOrEqual(0);
            expect(material.restitution).toBeLessThanOrEqual(1);

            const isFluid = name === "air" || name === "water";
            if (isFluid) {
                expect(material.tensileYieldStrainStress).toEqual([0, 0]);
                expect(material.tensileFractureStrainStress).toEqual([0, 0]);
                expect(material.compressiveYieldStrainStress).toEqual([0, 0]);
                expect(material.compressiveFractureStrainStress).toEqual([0, 0]);
                return;
            }

            const [εty, σty] = material.tensileYieldStrainStress;
            const [εtf, σtf] = material.tensileFractureStrainStress;
            const [εcy, σcy] = material.compressiveYieldStrainStress;
            const [εcf, σcf] = material.compressiveFractureStrainStress;

            expect(εty).toBeGreaterThanOrEqual(0);
            expect(σty).toBeGreaterThanOrEqual(0);
            expect(εtf).toBeGreaterThanOrEqual(0);
            expect(σtf).toBeGreaterThanOrEqual(0);
            expect(εtf).toBeGreaterThanOrEqual(εty);

            expect(εcy).toBeLessThanOrEqual(0);
            expect(σcy).toBeLessThanOrEqual(0);
            expect(εcf).toBeLessThanOrEqual(0);
            expect(εcf).toBeLessThanOrEqual(0);
            expect(εcf).toBeLessThanOrEqual(εcy);
        });
    });
});
