import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Line3 } from "@adobe/data/math";
import { Aabb } from "types/aabb/index.js";
import { DenseVolume } from "./dense-volume.js";
import { PhysicalVoxel } from "../physical-voxel/physical-voxel.js";
import { Material } from "../material/material.js";
import { pick } from "./pick.js";

describe("DenseVolume.pick", () => {
    const { air, rock, steel, concrete } = Material.ids;
    const pickable = (voxel: number) => PhysicalVoxel.getMaterialId(voxel) !== air;

    describe("picking from different directions", () => {
        it("should pick from positive X direction", () => {
            // Create a 5x1x1 volume with a pickable voxel at x=2
            const data = [air, air, rock, air, air];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from before the volume through it in +X direction
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]); // Should pick voxel at x=2
            expect(result?.face).toBe(Aabb.Face.NEG_X); // Entering from negative X side
        });

        it("should pick from negative X direction", () => {
            // Create a 5x1x1 volume with a pickable voxel at x=2
            const data = [air, air, rock, air, air];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from after the volume through it in -X direction
            const line: Line3 = {
                a: [10, 0.5, 0.5],
                b: [-1, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]); // Should still pick voxel at x=2
            expect(result?.face).toBe(Aabb.Face.POS_X); // Entering from positive X side
        });

        it("should pick from positive Y direction", () => {
            // Create a 1x5x1 volume with a pickable voxel at y=3
            const data = [air, air, air, steel, air];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [1, 5, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from below the volume through it in +Y direction
            const line: Line3 = {
                a: [0.5, -1, 0.5],
                b: [0.5, 10, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 3, 0]); // Should pick voxel at y=3
            expect(result?.face).toBe(Aabb.Face.NEG_Y); // Entering from negative Y side
        });

        it("should pick from positive Z direction", () => {
            // Create a 1x1x5 volume with a pickable voxel at z=1
            const data = [air, concrete, air, air, air];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from in front of the volume through it in +Z direction
            const line: Line3 = {
                a: [0.5, 0.5, -1],
                b: [0.5, 0.5, 10]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 1]); // Should pick voxel at z=1
            expect(result?.face).toBe(Aabb.Face.NEG_Z); // Entering from negative Z side
        });

        it("should pick from diagonal direction", () => {
            // Create a 3x3x3 volume with a pickable voxel in the middle
            const data = new Array(27).fill(air);
            const centerIndex = DenseVolume.getIndex({ type: "dense", size: [3, 3, 3], data: createTypedBuffer(PhysicalVoxel.schema, data) }, 1, 1, 1);
            data[centerIndex] = rock;
            
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from corner through center
            const line: Line3 = {
                a: [-1, -1, -1],
                b: [5, 5, 5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 1, 1]); // Should pick center voxel
        });
    });

    describe("picking closest voxel", () => {
        it("should pick the first (closest) pickable voxel", () => {
            // Create a 5x1x1 volume with multiple pickable voxels
            const data = [air, rock, steel, concrete, air];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 0, 0]); // Should pick first pickable voxel (ROCK at x=1)
        });

        it("should skip air voxels and pick the first solid one", () => {
            // Create a 5x1x1 volume with air voxels followed by solid
            const data = [air, air, air, rock, steel];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([3, 0, 0]); // Should pick first solid voxel (ROCK at x=3)
        });
    });

    describe("edge cases", () => {
        it("should return null when no pickable voxel is found", () => {
            // Create a 3x3x3 volume with all air voxels
            const data = new Array(27).fill(air);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            const line: Line3 = {
                a: [-1, 1.5, 1.5],
                b: [10, 1.5, 1.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).toBeNull();
        });

        it("should return null when ray misses the volume entirely (broad-phase)", () => {
            // Create a 3x3x3 volume at [0,0,0] to [3,3,3]
            const data = new Array(27).fill(rock);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray that misses the volume entirely (parallel above it)
            const line: Line3 = {
                a: [1, 10, 1],
                b: [1, 20, 1]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).toBeNull();
        });

        it("should return null when ray misses the volume in diagonal direction", () => {
            // Create a 3x3x3 volume
            const data = new Array(27).fill(rock);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray that misses the volume entirely (diagonal miss)
            const line: Line3 = {
                a: [10, 10, 10],
                b: [20, 20, 20]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).toBeNull();
        });

        it("should return null when ray starts after the volume", () => {
            // Create a 3x3x3 volume
            const data = new Array(27).fill(rock);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray that starts after the volume
            const line: Line3 = {
                a: [10, 1.5, 1.5],
                b: [20, 1.5, 1.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).toBeNull();
        });

        it("should handle ray starting inside the volume", () => {
            // Create a 5x5x5 volume
            const data = new Array(125).fill(rock);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 5, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray starting inside at voxel (2, 2, 2)
            const line: Line3 = {
                a: [2.5, 2.5, 2.5],
                b: [10, 2.5, 2.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 2, 2]);
        });

        it("should handle zero-length ray", () => {
            const data = [rock];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Zero-length ray (same start and end)
            const line: Line3 = {
                a: [0.5, 0.5, 0.5],
                b: [0.5, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).toBeNull();
        });
    });

    describe("different volume sizes", () => {
        it("should work with 1x1x1 volume", () => {
            const data = [rock];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [2, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 0]);
        });

        it("should work with flat 10x10x1 volume", () => {
            // Create a flat volume with a pickable voxel at (5, 5, 0)
            const data = new Array(100).fill(air);
            const targetIndex = DenseVolume.getIndex({ type: "dense", size: [10, 10, 1], data: createTypedBuffer(PhysicalVoxel.schema, data) }, 5, 5, 0);
            data[targetIndex] = steel;
            
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [10, 10, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray through the center of the target voxel
            const line: Line3 = {
                a: [5.5, 5.5, -1],
                b: [5.5, 5.5, 2]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([5, 5, 0]);
        });

        it("should work with tall 1x1x10 volume", () => {
            // Create a tall volume with a pickable voxel at z=7
            const data = new Array(10).fill(air);
            data[7] = concrete;
            
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 10],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from bottom to top
            const line: Line3 = {
                a: [0.5, 0.5, -1],
                b: [0.5, 0.5, 15]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 7]);
        });

        it("should work with large 20x20x20 volume", () => {
            // Create a large volume with a pickable voxel at (10, 10, 10)
            const data = new Array(8000).fill(air);
            const targetIndex = DenseVolume.getIndex({ type: "dense", size: [20, 20, 20], data: createTypedBuffer(PhysicalVoxel.schema, data) }, 10, 10, 10);
            data[targetIndex] = rock;
            
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [20, 20, 20],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray through the target voxel
            const line: Line3 = {
                a: [10.5, 10.5, -5],
                b: [10.5, 10.5, 25]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([10, 10, 10]);
        });
    });

    describe("custom pickable predicates", () => {
        it("should use custom predicate for picking", () => {
            // Create a volume with different materials
            const data = [rock, steel, concrete, rock, steel];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            // Pick only concrete voxels
            const result = pick(volume, line, (voxel) => voxel === concrete);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]); // Should pick the concrete voxel at x=2
        });

        it("should pick first matching material only", () => {
            // Create a volume with different materials
            const data = [steel, concrete, rock, steel, rock];
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            // Pick only rock voxels
            const result = pick(volume, line, (voxel) => voxel === rock);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]); // Should pick first rock voxel at x=2, not the one at 4
        });
    });
});

