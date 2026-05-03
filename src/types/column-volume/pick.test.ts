import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Line3 } from "@adobe/data/math";
import { Aabb } from "types/aabb/index.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "./column-volume.js";
import { PhysicalVoxel } from "../physical-voxel/physical-voxel.js";
import { Material } from "../material/material.js";
import { create } from "./create.js";
import { pick } from "./pick.js";

describe("ColumnVolume.pick", () => {
    const { air, rock, steel, concrete } = Material.ids;
    const pickable = (voxel: number) => PhysicalVoxel.getMaterialId(voxel) !== air;

    /**
     * Helper to create a ColumnVolume from a DenseVolume for testing
     */
    const createColumnVolume = (denseVolume: DenseVolume<number>): ColumnVolume<number> => {
        return create(denseVolume);
    };

    describe("picking from different directions", () => {
        it("should pick from positive X direction", () => {
            // Create a 5x1x1 dense volume with a pickable voxel at x=2
            const data = [air, air, rock, air, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

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
            // Create a 5x1x1 dense volume with a pickable voxel at x=2
            const data = [air, air, rock, air, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

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

        it("should pick from positive Z direction", () => {
            // Create a 1x1x5 dense volume with a pickable voxel at z=1
            const data = [air, concrete, air, air, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

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

        it("should skip empty columns", () => {
            // Create a 5x1x1 volume with only one column at x=2 having a voxel
            const data = [air, air, rock, air, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray that passes through empty columns before hitting the solid one
            const line: Line3 = {
                a: [0, 0.5, 0.5],
                b: [5, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]);
        });
    });

    describe("picking with zStart offsets", () => {
        it("should pick voxel with zStart offset", () => {
            // Create a volume where column starts at z=2 instead of z=0
            // This requires creating a dense volume with air at z=0,1 and solid at z=2
            const data = new Array(5).fill(air);
            data[2] = rock;
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from above, should hit the voxel at z=2
            const line: Line3 = {
                a: [0.5, 0.5, 5],
                b: [0.5, 0.5, 0]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 2]);
        });
    });

    describe("complex column scenarios", () => {
        it("should pick from multiple columns with different zStart offsets", () => {
            // Create a 3x1x5 volume where:
            // Column at x=0: voxels at z=0,1,2
            // Column at x=1: voxels at z=2,3,4 (zStart=2)
            // Column at x=2: voxels at z=0,1
            const data = new Array(3 * 1 * 5).fill(air);
            // Column 0: z=0,1,2
            data[0] = rock;
            data[1] = rock;
            data[2] = rock;
            // Column 1: z=2,3,4
            data[7] = steel; // z=2 in column 1
            data[8] = steel; // z=3 in column 1
            data[9] = steel; // z=4 in column 1
            // Column 2: z=0,1
            data[10] = concrete;
            data[11] = concrete;

            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Pick through column 1 (ray enters at z=5, steps down, first voxel hit is at z=3)
            const line: Line3 = {
                a: [1.5, 0.5, 5],
                b: [1.5, 0.5, 0]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            // Ray enters volume at z=5, DDA steps down and first encounters voxel at z=3 in column 1
            expect(result?.coordinates[0]).toBe(1);
            expect(result?.coordinates[1]).toBe(0);
            expect(result?.coordinates[2]).toBeGreaterThanOrEqual(2);
            expect(result?.coordinates[2]).toBeLessThanOrEqual(4);
        });

        it("should handle columns with gaps (non-contiguous z ranges)", () => {
            // Create a volume where a column has voxels at z=0 and z=3, but not z=1,2
            // This creates a column with zStart=0, length=4 (includes gaps)
            const data = new Array(1 * 1 * 5).fill(air);
            data[0] = rock;  // z=0
            data[3] = steel; // z=3

            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Pick from above, should hit z=3 first (closest to ray start)
            const line: Line3 = {
                a: [0.5, 0.5, 5],
                b: [0.5, 0.5, 0]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 3]);
        });

        it("should pick from diagonal direction across multiple columns", () => {
            // Create a 3x3x3 volume with voxels in a diagonal pattern
            const data = new Array(27).fill(air);
            // Place voxels at (0,0,0), (1,1,1), (2,2,2)
            data[0] = rock;        // (0,0,0)
            data[13] = steel;      // (1,1,1)
            data[26] = concrete;   // (2,2,2)

            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from corner through center
            const line: Line3 = {
                a: [-1, -1, -1],
                b: [5, 5, 5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 0]); // Should pick first voxel encountered
        });
    });

    describe("boundary conditions", () => {
        it("should pick voxel at volume boundary (x=0)", () => {
            const data = new Array(5).fill(air);
            data[0] = rock; // First voxel
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [2, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 0]);
        });

        it("should pick voxel at volume boundary (z=max)", () => {
            const data = new Array(5).fill(air);
            data[4] = rock; // Last voxel at z=4
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            const line: Line3 = {
                a: [0.5, 0.5, 6],
                b: [0.5, 0.5, 0]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 4]);
        });

        it("should handle ray starting inside volume", () => {
            const data = new Array(125).fill(rock);
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 5, 5],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray starting inside at voxel (2, 2, 2)
            const line: Line3 = {
                a: [2.5, 2.5, 2.5],
                b: [10, 2.5, 2.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 2, 2]);
        });
    });

    describe("sparse volume performance scenarios", () => {
        it("should efficiently skip many empty columns", () => {
            // Create a 16x16x1 volume with only one column having a voxel
            const data = new Array(16 * 16).fill(air);
            // Place a single voxel at (8, 8, 0)
            const index = 8 + 8 * 16;
            data[index] = rock;

            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [16, 16, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray that passes through many empty columns
            const line: Line3 = {
                a: [0, 8.5, 0.5],
                b: [16, 8.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([8, 8, 0]);
        });

        it("should handle large sparse volume with scattered columns", () => {
            // Create a 32x32x8 volume with only a few columns having voxels
            const data = new Array(32 * 32 * 8).fill(air);
            // Place voxels at specific scattered positions
            data[0] = rock;           // (0, 0, 0)
            data[1000] = steel;       // Somewhere in the middle
            data[8191] = concrete;     // Near the end

            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [32, 32, 8],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Pick through the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [33, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([0, 0, 0]); // Should pick first encountered
        });
    });

    describe("edge cases", () => {
        it("should return null when no pickable voxel is found", () => {
            // Create a volume with all air voxels
            const data = new Array(27).fill(air);
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            const line: Line3 = {
                a: [-1, 1.5, 1.5],
                b: [5, 1.5, 1.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).toBeNull();
        });

        it("should return null when line doesn't intersect volume", () => {
            const data = [rock];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Line far away from volume
            const line: Line3 = {
                a: [10, 10, 10],
                b: [20, 20, 20]
            };

            const result = pick(volume, line, pickable);
            expect(result).toBeNull();
        });

        it("should return null for zero-length ray", () => {
            const data = [rock];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Zero-length ray
            const line: Line3 = {
                a: [0.5, 0.5, 0.5],
                b: [0.5, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).toBeNull();
        });

        it("should pick the closest voxel when multiple are pickable", () => {
            // Create a 5x1x1 volume with multiple pickable voxels
            const data = [air, rock, steel, concrete, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 0, 0]); // Should pick first pickable voxel (ROCK at x=1)
        });
    });

    describe("angled and grazing rays", () => {
        it("should pick with shallow angle in XY plane", () => {
            // 5x5x1 volume, solid at (2, 2, 0). Ray at shallow angle through center
            const data = new Array(25).fill(air);
            data[2 + 2 * 5] = rock;
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 5, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from (-1, 1, 0.5) to (6, 3, 0.5) - passes through (2.5, 2, 0.5) at t=0.5
            const line: Line3 = {
                a: [-1, 1, 0.5],
                b: [6, 3, 0.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 2, 0]);
        });

        it("should pick with diagonal ray entering at corner", () => {
            // 3x3x1 volume, solid at (2, 2, 0). Ray enters at bottom-left corner
            const data = new Array(9).fill(air);
            data[8] = rock; // (2, 2, 0)
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from (-1, -1, 0.5) through corner (0,0) to (4, 4, 0.5)
            const line: Line3 = {
                a: [-1, -1, 0.5],
                b: [4, 4, 0.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 2, 0]);
        });

        it("should pick with grazing ray nearly parallel to X face", () => {
            // 5x5x1 volume, solid at (2, 2, 0). Ray nearly parallel to Y (small dy)
            const data = new Array(25).fill(air);
            data[2 + 2 * 5] = rock;
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [5, 5, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray with very shallow Y component: from (-1, 2.1, 0.5) to (6, 2.2, 0.5)
            const line: Line3 = {
                a: [-1, 2.1, 0.5],
                b: [6, 2.2, 0.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 2, 0]);
        });

        it("should pick when entry point is exactly on voxel boundary", () => {
            // Volume with solid at (1, 0, 0). Ray enters at x=1.0 exactly
            const data = [air, rock, air];
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 1, 1],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from (0, 0.5, 0.5) to (3, 0.5, 0.5) - enters at x=0, passes through x=1
            const line: Line3 = {
                a: [0, 0.5, 0.5],
                b: [3, 0.5, 0.5]
            };

            const result = pick(volume, line, pickable);
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 0, 0]);
        });

        it("should pick with angled ray in 3D crossing multiple voxels", () => {
            // 3x3x3 volume, solid at (1, 1, 1). Angled ray through center
            const data = new Array(27).fill(air);
            data[13] = rock; // (1, 1, 1)
            const denseVolume: DenseVolume<number> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(PhysicalVoxel.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            // Ray from (-1, -1, -1) to (5, 5, 5) - diagonal through center
            const line: Line3 = {
                a: [-1, -1, -1],
                b: [5, 5, 5]
            };

            const result = pick(volume, line, pickable);
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 1, 1]);
        });
    });
});

