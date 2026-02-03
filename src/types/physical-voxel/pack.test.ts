// © 2026 Adobe. MIT License. See /LICENSE for details.

import { describe, it, expect } from "vitest";
import { PhysicalVoxel } from "./physical-voxel.js";

describe("pack", () => {
    it("should pack values correctly", () => {
        const v = PhysicalVoxel.pack(42, 273, 10, true, false, true, true);
        expect(v).toBe(
            (1 << 31) | (1 << 30) | (0 << 29) | (1 << 28) | (10 << 24) | (273 << 12) | 42
        );
    });

    it("should support partial args with defaults", () => {
        expect(PhysicalVoxel.pack(42)).toBe(42);
        expect(PhysicalVoxel.pack(42, 273)).toBe((273 << 12) | 42);
    });

    it("should handle boundary values", () => {
        expect(PhysicalVoxel.pack()).toBe(0);
        expect(PhysicalVoxel.pack(4095, 4095, 15, true, true, true, true) >>> 0).toBe(0xffffffff);
    });

    it("should throw for out of range amountOrHealth", () => {
        expect(() => PhysicalVoxel.pack(0, 0, -1)).toThrow(
            "Amount/health -1 is out of range [0, 15]"
        );
        expect(() => PhysicalVoxel.pack(0, 0, 16)).toThrow(
            "Amount/health 16 is out of range [0, 15]"
        );
    });

    it("should throw for out of range temperature", () => {
        expect(() => PhysicalVoxel.pack(0, -1)).toThrow(
            "Temperature -1 is out of range [0, 4095]"
        );
        expect(() => PhysicalVoxel.pack(0, 4096)).toThrow(
            "Temperature 4096 is out of range [0, 4095]"
        );
    });

    it("should throw for out of range materialTypeId", () => {
        expect(() => PhysicalVoxel.pack(-1)).toThrow(
            "Material type ID -1 is out of range [0, 4095]"
        );
        expect(() => PhysicalVoxel.pack(4096)).toThrow(
            "Material type ID 4096 is out of range [0, 4095]"
        );
    });
});

describe("repack", () => {
    it("should repack unpacked object to same value", () => {
        const v = PhysicalVoxel.pack(42, 273, 10, true, false, true, true);
        const unpacked = PhysicalVoxel.unpack(v);
        expect(PhysicalVoxel.repack(unpacked)).toBe(v);
    });
});
