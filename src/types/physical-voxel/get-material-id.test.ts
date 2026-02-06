import { describe, it, expect } from "vitest";
import { PhysicalVoxel } from "./physical-voxel.js";

describe("getMaterialId", () => {
    it("should extract material ID from low 12 bits", () => {
        const v = PhysicalVoxel.pack(42, 4095, 15, true, true, true, true);
        expect(PhysicalVoxel.getMaterialId(v)).toBe(42);
    });

    it("should match materialIdMask for any packed value", () => {
        const v = PhysicalVoxel.pack(1234);
        expect(PhysicalVoxel.getMaterialId(v)).toBe(v & PhysicalVoxel.materialIdMask);
    });
});
