import { describe, it, expect } from "vitest";
import { toVec4, fromVec4, isVisible } from "./rgba.js";
import { Vec4 } from "@adobe/data/math";

describe("Rgba", () => {
    describe("toVec4", () => {
        it("should correctly extract RGBA values from packed u32", () => {
            // Test with known values: R=87, G=69, B=163, A=255
            // Packed as: R << 0 | G << 8 | B << 16 | A << 24
            const packed = (87 << 0) | (69 << 8) | (163 << 16) | (255 << 24);
            
            const vec4 = toVec4(packed);
            
            expect(vec4[0]).toBeCloseTo(87 / 255, 3); // R
            expect(vec4[1]).toBeCloseTo(69 / 255, 3); // G
            expect(vec4[2]).toBeCloseTo(163 / 255, 3); // B
            expect(vec4[3]).toBeCloseTo(255 / 255, 3); // A
        });

        it("should handle zero values correctly", () => {
            const packed = (0 << 0) | (0 << 8) | (0 << 16) | (0 << 24);
            
            const vec4 = toVec4(packed);
            
            expect(vec4).toEqual([0, 0, 0, 0]);
        });

        it("should handle maximum values correctly", () => {
            const packed = (255 << 0) | (255 << 8) | (255 << 16) | (255 << 24);
            
            const vec4 = toVec4(packed);
            
            expect(vec4).toEqual([1, 1, 1, 1]);
        });
    });

    describe("fromVec4", () => {
        it("should correctly pack RGBA values into u32", () => {
            const vec4: Vec4 = [87/255, 69/255, 163/255, 255/255];
            
            const packed = fromVec4(vec4);
            
            // Extract bytes to verify packing
            const r = (packed >>> 0) & 0xFF;
            const g = (packed >>> 8) & 0xFF;
            const b = (packed >>> 16) & 0xFF;
            const a = (packed >>> 24) & 0xFF;
            
            expect(r).toBe(87);
            expect(g).toBe(69);
            expect(b).toBe(163);
            expect(a).toBe(255);
        });

        it("should handle zero values correctly", () => {
            const vec4: Vec4 = [0, 0, 0, 0];
            
            const packed = fromVec4(vec4);
            
            expect(packed).toBe(0);
        });

        it("should handle maximum values correctly", () => {
            const vec4: Vec4 = [1, 1, 1, 1];
            
            const packed = fromVec4(vec4);
            
            // Extract bytes to verify packing
            const r = (packed >>> 0) & 0xFF;
            const g = (packed >>> 8) & 0xFF;
            const b = (packed >>> 16) & 0xFF;
            const a = (packed >>> 24) & 0xFF;
            
            expect(r).toBe(255);
            expect(g).toBe(255);
            expect(b).toBe(255);
            expect(a).toBe(255);
        });
    });

    describe("round-trip conversion", () => {
        it("should maintain values through pack/unpack cycle", () => {
            const originalVec4: Vec4 = [0.5, 0.25, 0.75, 0.8];
            
            const packed = fromVec4(originalVec4);
            const unpacked = toVec4(packed);
            
            // Allow for floating point precision loss when converting to/from u8
            expect(unpacked[0]).toBeCloseTo(originalVec4[0], 2);
            expect(unpacked[1]).toBeCloseTo(originalVec4[1], 2);
            expect(unpacked[2]).toBeCloseTo(originalVec4[2], 2);
            expect(unpacked[3]).toBeCloseTo(originalVec4[3], 2);
        });

        it("should handle edge cases in round-trip", () => {
            const testCases: Vec4[] = [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0.5, 0.5, 0.5, 0.5],
                [0.1, 0.2, 0.3, 0.4],
                [0.9, 0.8, 0.7, 0.6]
            ];

            testCases.forEach(originalVec4 => {
                const packed = fromVec4(originalVec4);
                const unpacked = toVec4(packed);
                
                expect(unpacked[0]).toBeCloseTo(originalVec4[0], 2);
                expect(unpacked[1]).toBeCloseTo(originalVec4[1], 2);
                expect(unpacked[2]).toBeCloseTo(originalVec4[2], 2);
                expect(unpacked[3]).toBeCloseTo(originalVec4[3], 2);
            });
        });
    });

    describe("isVisible", () => {
        it("should return true for opaque pixels", () => {
            const opaquePacked = (87 << 0) | (69 << 8) | (163 << 16) | (255 << 24);
            
            expect(isVisible(opaquePacked)).toBe(true);
        });

        it("should return false when R channel is zero", () => {
            const zeroRPacked = (0 << 0) | (69 << 8) | (163 << 16) | (255 << 24);
            
            expect(isVisible(zeroRPacked)).toBe(false);
        });

        it("should return true when R channel is non-zero", () => {
            const nonZeroRPacked = (87 << 0) | (69 << 8) | (163 << 16) | (128 << 24);
            
            expect(isVisible(nonZeroRPacked)).toBe(true);
        });
    });
});
