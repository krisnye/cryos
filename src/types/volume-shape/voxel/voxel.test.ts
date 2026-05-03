import { describe, expect, it } from "vitest";
import { Aabb } from "types/aabb/index.js";
import { Voxel } from "./voxel.js";

describe("Voxel flags", () => {
    it("FULL and INTERIOR sit above the Aabb.Face adjacency mask", () => {
        expect(Voxel.FULL & Aabb.Face.ALL).toBe(0);
        expect(Voxel.INTERIOR & Aabb.Face.ALL).toBe(0);
        expect(Voxel.FULL & Voxel.INTERIOR).toBe(0);
    });
});
