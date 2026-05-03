import { describe, expect, test } from "vitest";
import { Material } from "./material.js";
import { youngsModulusCompression, youngsModulusTension } from "./youngs-modulus.js";

describe("Material youngs modulus helpers", () => {
    test("returns 0 for fluids (zero strain at yield)", () => {
        const air = Material.materials[Material.ids.air];
        expect(youngsModulusTension(air)).toBe(0);
        expect(youngsModulusCompression(air)).toBe(0);
    });

    test("steel tensile E is ~200 GPa in MPa from yield point", () => {
        const steel = Material.materials[Material.ids.steel];
        const e = youngsModulusTension(steel);
        expect(e).toBeGreaterThan(180_000);
        expect(e).toBeLessThan(220_000);
    });

    test("compression modulus is positive for steel", () => {
        const steel = Material.materials[Material.ids.steel];
        expect(youngsModulusCompression(steel)).toBeGreaterThan(0);
    });
});
