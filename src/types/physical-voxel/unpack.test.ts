import { describe, it, expect } from "vitest";
import { PhysicalVoxel } from "./physical-voxel.js";

describe("unpack", () => {
    it("should unpack values correctly", () => {
        const packed = PhysicalVoxel.pack(42, 273, 10, true, false, true, true);
        const unpacked = PhysicalVoxel.unpack(packed);
        expect(unpacked).toEqual({
            sediment: true,
            bondX: true,
            bondY: false,
            bondZ: true,
            amountOrHealth: 10,
            temperature: 273,
            materialTypeId: 42,
        });
    });

    it("should handle boundary values", () => {
        const unpacked1 = PhysicalVoxel.unpack(PhysicalVoxel.pack());
        expect(unpacked1).toEqual({
            sediment: false,
            bondX: false,
            bondY: false,
            bondZ: false,
            amountOrHealth: 0,
            temperature: 0,
            materialTypeId: 0,
        });

        const unpacked2 = PhysicalVoxel.unpack(PhysicalVoxel.pack(4095, 4095, 15, true, true, true, true));
        expect(unpacked2).toEqual({
            sediment: true,
            bondX: true,
            bondY: true,
            bondZ: true,
            amountOrHealth: 15,
            temperature: 4095,
            materialTypeId: 4095,
        });
    });

    it("should round-trip correctly", () => {
        const testCases = [
            { sediment: false, bondX: false, bondY: false, bondZ: false, amountOrHealth: 0, temperature: 0, materialTypeId: 0 },
            { sediment: true, bondX: true, bondY: false, bondZ: true, amountOrHealth: 10, temperature: 273, materialTypeId: 42 },
            { sediment: false, bondX: true, bondY: true, bondZ: false, amountOrHealth: 7, temperature: 1000, materialTypeId: 255 },
        ];
        for (const tc of testCases) {
            const packed = PhysicalVoxel.pack(tc.materialTypeId, tc.temperature, tc.amountOrHealth, tc.bondZ, tc.bondY, tc.bondX, tc.sediment);
            const unpacked = PhysicalVoxel.unpack(packed);
            expect(unpacked).toEqual(tc);
        }
    });
});
