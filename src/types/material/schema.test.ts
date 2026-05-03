import { describe, expect, it } from "vitest";
import { getStructLayout } from "@adobe/data/typed-buffer";
import { schema } from "./schema.js";

describe("Material.schema GPU layout", () => {
    it("matches the WGSL storage struct that pairs with this schema", () => {
        const layout = getStructLayout(schema);

        expect(layout.layout).toBe("storage");
        expect(layout.align).toBe(16);
        expect(layout.size).toBe(112);

        expect(layout.fields.baseColor.offset).toBe(0);
        expect(layout.fields.metallic.offset).toBe(16);
        expect(layout.fields.roughness.offset).toBe(20);
        expect(layout.fields.irReflectance.offset).toBe(24);
        expect(layout.fields.irEmission.offset).toBe(28);
        expect(layout.fields.emissionRgb.offset).toBe(32);
        expect(layout.fields.emissionMode.offset).toBe(44);
        expect(layout.fields.density.offset).toBe(48);
        expect(layout.fields.viscosity.offset).toBe(52);
        expect(layout.fields.specificHeatCapacity.offset).toBe(56);
        expect(layout.fields.thermalConductivity.offset).toBe(60);
        expect(layout.fields.tensileYieldStrainStress.offset).toBe(64);
        expect(layout.fields.tensileFractureStrainStress.offset).toBe(72);
        expect(layout.fields.compressiveYieldStrainStress.offset).toBe(80);
        expect(layout.fields.compressiveFractureStrainStress.offset).toBe(88);
        expect(layout.fields.restitution.offset).toBe(96);
    });
});
