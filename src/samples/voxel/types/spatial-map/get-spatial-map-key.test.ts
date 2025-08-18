import { describe, it, expect } from "vitest";
import { getSpatialMapKey } from "./get-spatial-map-key.js";

describe("getSpatialMapKey", () => {
    it("should resolve positions within the same integer AABB to the same hash", () => {
        // Test that all positions within the (0,0) to (1,1) AABB resolve to the same hash
        const hash00 = getSpatialMapKey([0, 0]);
        expect(getSpatialMapKey([0.1, 0.1])).toBe(hash00);
        expect(getSpatialMapKey([0.5, 0.5])).toBe(hash00);
        expect(getSpatialMapKey([0.9, 0.9])).toBe(hash00);
        expect(getSpatialMapKey([0.99, 0.99])).toBe(hash00);
        
        // Test that all positions within the (1,1) to (2,2) AABB resolve to the same hash
        const hash11 = getSpatialMapKey([1, 1]);
        expect(getSpatialMapKey([1.1, 1.1])).toBe(hash11);
        expect(getSpatialMapKey([1.5, 1.5])).toBe(hash11);
        expect(getSpatialMapKey([1.9, 1.9])).toBe(hash11);
        expect(getSpatialMapKey([1.99, 1.99])).toBe(hash11);
        
        // Test that all positions within the (2,2) to (3,3) AABB resolve to the same hash
        const hash22 = getSpatialMapKey([2, 2]);
        expect(getSpatialMapKey([2.1, 2.1])).toBe(hash22);
        expect(getSpatialMapKey([2.5, 2.5])).toBe(hash22);
        expect(getSpatialMapKey([2.9, 2.9])).toBe(hash22);
        expect(getSpatialMapKey([2.99, 2.99])).toBe(hash22);
    });

    it("should handle negative coordinates correctly", () => {
        // Test negative X coordinates
        const hashNeg10 = getSpatialMapKey([-1, 0]);
        expect(getSpatialMapKey([-0.1, 0])).toBe(hashNeg10);
        expect(getSpatialMapKey([-0.5, 0])).toBe(hashNeg10);
        expect(getSpatialMapKey([-0.9, 0])).toBe(hashNeg10);
        
        // Test negative Y coordinates
        const hash0Neg1 = getSpatialMapKey([0, -1]);
        expect(getSpatialMapKey([0, -0.1])).toBe(hash0Neg1);
        expect(getSpatialMapKey([0, -0.5])).toBe(hash0Neg1);
        expect(getSpatialMapKey([0, -0.9])).toBe(hash0Neg1);
        
        // Test negative X and Y coordinates
        const hashNeg1Neg1 = getSpatialMapKey([-1, -1]);
        expect(getSpatialMapKey([-0.1, -0.1])).toBe(hashNeg1Neg1);
        expect(getSpatialMapKey([-0.5, -0.5])).toBe(hashNeg1Neg1);
        expect(getSpatialMapKey([-0.9, -0.9])).toBe(hashNeg1Neg1);
    });

    it("should handle large negative coordinates", () => {
        // Test large negative values
        const hashNeg100Neg200 = getSpatialMapKey([-100, -200]);
        expect(getSpatialMapKey([-99.1, -199.1])).toBe(hashNeg100Neg200);
        expect(getSpatialMapKey([-99.5, -199.5])).toBe(hashNeg100Neg200);
        expect(getSpatialMapKey([-99.9, -199.9])).toBe(hashNeg100Neg200);
    });

    it("should handle Vec3 and Vec4 inputs correctly", () => {
        // Test Vec3 input (should use first two components)
        const hash2D = getSpatialMapKey([1, 2]);
        expect(getSpatialMapKey([1, 2, 3])).toBe(hash2D);
        expect(getSpatialMapKey([1, 2, 999])).toBe(hash2D);
        
        // Test Vec4 input (should use first two components)
        expect(getSpatialMapKey([1, 2, 3, 4])).toBe(hash2D);
        expect(getSpatialMapKey([1, 2, -999, 888])).toBe(hash2D);
    });

    it("should produce different hashes for different integer AABBs", () => {
        const hash00 = getSpatialMapKey([0, 0]);
        const hash01 = getSpatialMapKey([0, 1]);
        const hash10 = getSpatialMapKey([1, 0]);
        const hash11 = getSpatialMapKey([1, 1]);
        
        // All should be different
        expect(hash00).not.toBe(hash01);
        expect(hash00).not.toBe(hash10);
        expect(hash00).not.toBe(hash11);
        expect(hash01).not.toBe(hash10);
        expect(hash01).not.toBe(hash11);
        expect(hash10).not.toBe(hash11);
    });

    it("should handle edge cases at integer boundaries", () => {
        // Test exactly at integer boundaries
        const hash00 = getSpatialMapKey([0, 0]);
        const hash11 = getSpatialMapKey([1, 1]);
        
        // These should be different
        expect(hash00).not.toBe(hash11);
        
        // Test very close to boundaries
        expect(getSpatialMapKey([0.999999, 0.999999])).toBe(hash00);
        expect(getSpatialMapKey([1.000001, 1.000001])).toBe(hash11);
    });

    it("should verify the hash calculation formula", () => {
        // Test the y << 16 | x formula explicitly
        expect(getSpatialMapKey([0, 0])).toBe((0 << 16) | 0); // 0
        expect(getSpatialMapKey([1, 0])).toBe((0 << 16) | 1); // 1
        expect(getSpatialMapKey([0, 1])).toBe((1 << 16) | 0); // 65536
        expect(getSpatialMapKey([1, 1])).toBe((1 << 16) | 1); // 65537
        expect(getSpatialMapKey([255, 255])).toBe((255 << 16) | 255); // 16711935
    });
}); 