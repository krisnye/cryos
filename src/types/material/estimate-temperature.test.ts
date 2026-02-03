// © 2026 Adobe. MIT License. See /LICENSE for details.

import { describe, it, expect } from "vitest";
import { Material } from "./material.js";

const T_AMBIENT = 298; // 25°C
const FULL_SUN = 1.0;

describe("Material.estimateTemperature", () => {
    it("returns ambient when solar exposure is 0", () => {
        const t = Material.estimateTemperature(
            Material.materials[Material.ids.steel],
            T_AMBIENT,
            0
        );
        expect(t).toBe(T_AMBIENT);
    });

    it("returns ambient for invalid material ID", () => {
        const t = Material.estimateTemperature(
            99999,
            T_AMBIENT,
            FULL_SUN
        );
        expect(t).toBe(T_AMBIENT);
    });

    it("produces higher temperature for darker materials in full sun", () => {
        const tConcrete = Material.estimateTemperature(
            Material.ids.concrete,
            T_AMBIENT,
            FULL_SUN
        );
        const tDirt = Material.estimateTemperature(
            Material.ids.dirt,
            T_AMBIENT,
            FULL_SUN
        );
        // Dirt is darker (lower luminance) than concrete
        expect(tDirt).toBeGreaterThan(tConcrete);
    });

    it("produces higher temperature for metals than non-metals in full sun", () => {
        const tSteel = Material.estimateTemperature(
            Material.ids.steel,
            T_AMBIENT,
            FULL_SUN
        );
        const tWood = Material.estimateTemperature(
            Material.ids.woodHard,
            T_AMBIENT,
            FULL_SUN
        );
        // Steel has lower default emissivity (metallic) → radiates less → stays hotter
        expect(tSteel).toBeGreaterThan(tWood);
    });

    it("produces variance across materials in full sun", () => {
        const temps = [
            Material.ids.steel,
            Material.ids.dirt,
            Material.ids.concrete,
            Material.ids.sand,
            Material.ids.marble,
        ].map((id) =>
            Material.estimateTemperature(id, T_AMBIENT, FULL_SUN)
        );
        const unique = new Set(temps);
        expect(unique.size).toBeGreaterThan(1);
    });

    it("scales with solar exposure", () => {
        const tHalf = Material.estimateTemperature(
            Material.ids.steel,
            T_AMBIENT,
            0.5
        );
        const tFull = Material.estimateTemperature(
            Material.ids.steel,
            T_AMBIENT,
            FULL_SUN
        );
        expect(tHalf).toBeLessThan(tFull);
        expect(tHalf).toBeGreaterThan(T_AMBIENT);
    });
});
