import { describe, it, expect } from "vitest";
import { Volume } from "./volume.js";
import { Rgba } from "../rgba/rgba.js";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { AabbFace, Line3 } from "@adobe/data/math";

describe("Volume.pick", () => {
    // Helper to create a simple RGBA color
    const color = (r: number, g: number, b: number, a: number): Rgba => {
        return (r << 0) | (g << 8) | (b << 16) | (a << 24);
    };

    const RED = color(255, 0, 0, 255);
    const GREEN = color(0, 255, 0, 255);
    const BLUE = color(0, 0, 255, 255);
    const TRANSPARENT = color(0, 0, 0, 0);

    describe("picking from different directions", () => {
        it("should pick from positive X direction", () => {
            // Create a 5x1x1 volume with a pickable voxel at index 2
            const data = [TRANSPARENT, TRANSPARENT, RED, TRANSPARENT, TRANSPARENT];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from before the volume through it in +X direction
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(2); // Should pick voxel at x=2
            expect(result?.face).toBe(AabbFace.NEG_X); // Entering from negative X side
        });

        it("should pick from negative X direction", () => {
            // Create a 5x1x1 volume with a pickable voxel at index 2
            const data = [TRANSPARENT, TRANSPARENT, RED, TRANSPARENT, TRANSPARENT];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from after the volume through it in -X direction
            const line: Line3 = {
                a: [10, 0.5, 0.5],
                b: [-1, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(2); // Should still pick voxel at x=2
            expect(result?.face).toBe(AabbFace.POS_X); // Entering from positive X side
        });

        it("should pick from positive Y direction", () => {
            // Create a 1x5x1 volume with a pickable voxel at y=3
            const data = [TRANSPARENT, TRANSPARENT, TRANSPARENT, GREEN, TRANSPARENT];
            const volume: Volume<Rgba> = {
                size: [1, 5, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from below the volume through it in +Y direction
            const line: Line3 = {
                a: [0.5, -1, 0.5],
                b: [0.5, 10, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(3); // Should pick voxel at y=3
            expect(result?.face).toBe(AabbFace.NEG_Y); // Entering from negative Y side
        });

        it("should pick from positive Z direction", () => {
            // Create a 1x1x5 volume with a pickable voxel at z=1
            const data = [TRANSPARENT, BLUE, TRANSPARENT, TRANSPARENT, TRANSPARENT];
            const volume: Volume<Rgba> = {
                size: [1, 1, 5],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from in front of the volume through it in +Z direction
            const line: Line3 = {
                a: [0.5, 0.5, -1],
                b: [0.5, 0.5, 10]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(1); // Should pick voxel at z=1
            expect(result?.face).toBe(AabbFace.NEG_Z); // Entering from negative Z side
        });

        it("should pick from diagonal direction", () => {
            // Create a 3x3x3 volume with a pickable voxel in the middle
            const data = new Array(27).fill(TRANSPARENT);
            const centerIndex = Volume.index({ size: [3, 3, 3], data: createTypedBuffer(Rgba.schema, data) }, 1, 1, 1);
            data[centerIndex] = RED;
            
            const volume: Volume<Rgba> = {
                size: [3, 3, 3],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from corner through center
            const line: Line3 = {
                a: [-1, -1, -1],
                b: [5, 5, 5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(centerIndex); // Should pick center voxel
        });
    });

    describe("picking closest voxel", () => {
        it("should pick the first (closest) pickable voxel", () => {
            // Create a 5x1x1 volume with multiple pickable voxels
            const data = [TRANSPARENT, RED, GREEN, BLUE, TRANSPARENT];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(1); // Should pick first pickable voxel (RED at index 1)
        });

        it("should skip transparent voxels and pick the first visible one", () => {
            // Create a 5x1x1 volume with transparent voxels followed by visible
            const data = [TRANSPARENT, TRANSPARENT, TRANSPARENT, RED, GREEN];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(3); // Should pick first visible voxel (RED at index 3)
        });
    });

    describe("edge cases", () => {
        it("should return null when no pickable voxel is found", () => {
            // Create a 3x3x3 volume with all transparent voxels
            const data = new Array(27).fill(TRANSPARENT);
            const volume: Volume<Rgba> = {
                size: [3, 3, 3],
                data: createTypedBuffer(Rgba.schema, data)
            };

            const line: Line3 = {
                a: [-1, 1.5, 1.5],
                b: [10, 1.5, 1.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).toBeNull();
        });

        it("should return null when ray misses the volume entirely (broad-phase)", () => {
            // Create a 3x3x3 volume at [0,0,0] to [3,3,3]
            const data = new Array(27).fill(RED);
            const volume: Volume<Rgba> = {
                size: [3, 3, 3],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray that misses the volume entirely (parallel above it)
            const line: Line3 = {
                a: [1, 10, 1],
                b: [1, 20, 1]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).toBeNull();
        });

        it("should return null when ray misses the volume in diagonal direction", () => {
            // Create a 3x3x3 volume
            const data = new Array(27).fill(RED);
            const volume: Volume<Rgba> = {
                size: [3, 3, 3],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray that misses the volume entirely (diagonal miss)
            const line: Line3 = {
                a: [10, 10, 10],
                b: [20, 20, 20]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).toBeNull();
        });

        it("should return null when ray starts after the volume", () => {
            // Create a 3x3x3 volume
            const data = new Array(27).fill(RED);
            const volume: Volume<Rgba> = {
                size: [3, 3, 3],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray that starts after the volume
            const line: Line3 = {
                a: [10, 1.5, 1.5],
                b: [20, 1.5, 1.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).toBeNull();
        });

        it("should handle ray starting inside the volume", () => {
            // Create a 5x5x5 volume
            const data = new Array(125).fill(RED);
            const volume: Volume<Rgba> = {
                size: [5, 5, 5],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray starting inside at voxel (2, 2, 2)
            const line: Line3 = {
                a: [2.5, 2.5, 2.5],
                b: [10, 2.5, 2.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(Volume.index(volume, 2, 2, 2));
        });

        it("should handle zero-length ray", () => {
            const data = [RED];
            const volume: Volume<Rgba> = {
                size: [1, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Zero-length ray (same start and end)
            const line: Line3 = {
                a: [0.5, 0.5, 0.5],
                b: [0.5, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).toBeNull();
        });
    });

    describe("different volume sizes", () => {
        it("should work with 1x1x1 volume", () => {
            const data = [RED];
            const volume: Volume<Rgba> = {
                size: [1, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [2, 0.5, 0.5]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(0);
        });

        it("should work with flat 10x10x1 volume", () => {
            // Create a flat volume with a pickable voxel at (5, 5, 0)
            const data = new Array(100).fill(TRANSPARENT);
            const targetIndex = Volume.index({ size: [10, 10, 1], data: createTypedBuffer(Rgba.schema, data) }, 5, 5, 0);
            data[targetIndex] = BLUE;
            
            const volume: Volume<Rgba> = {
                size: [10, 10, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray through the center of the target voxel
            const line: Line3 = {
                a: [5.5, 5.5, -1],
                b: [5.5, 5.5, 2]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(targetIndex);
        });

        it("should work with tall 1x1x10 volume", () => {
            // Create a tall volume with a pickable voxel at z=7
            const data = new Array(10).fill(TRANSPARENT);
            data[7] = GREEN;
            
            const volume: Volume<Rgba> = {
                size: [1, 1, 10],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from bottom to top
            const line: Line3 = {
                a: [0.5, 0.5, -1],
                b: [0.5, 0.5, 15]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(7);
        });

        it("should work with large 20x20x20 volume", () => {
            // Create a large volume with a pickable voxel at (10, 10, 10)
            const data = new Array(8000).fill(TRANSPARENT);
            const targetIndex = Volume.index({ size: [20, 20, 20], data: createTypedBuffer(Rgba.schema, data) }, 10, 10, 10);
            data[targetIndex] = RED;
            
            const volume: Volume<Rgba> = {
                size: [20, 20, 20],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray through the target voxel
            const line: Line3 = {
                a: [10.5, 10.5, -5],
                b: [10.5, 10.5, 25]
            };

            const result = Volume.pick(volume, line, (voxel) => !Rgba.isTransparent(voxel));
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(targetIndex);
        });
    });

    describe("custom pickable predicates", () => {
        it("should use custom predicate for picking", () => {
            // Create a volume with different colors
            const data = [RED, GREEN, BLUE, RED, GREEN];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            // Pick only blue voxels
            const result = Volume.pick(volume, line, (voxel) => {
                const b = (voxel >>> 16) & 0xFF;
                return b === 255;
            });
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(2); // Should pick the blue voxel at index 2
        });

        it("should pick first red voxel only", () => {
            // Create a volume with different colors
            const data = [GREEN, BLUE, RED, GREEN, RED];
            const volume: Volume<Rgba> = {
                size: [5, 1, 1],
                data: createTypedBuffer(Rgba.schema, data)
            };

            // Ray from before the volume
            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            // Pick only red voxels
            const result = Volume.pick(volume, line, (voxel) => {
                const r = (voxel >>> 0) & 0xFF;
                return r === 255;
            });
            
            expect(result).not.toBeNull();
            expect(result?.index).toBe(2); // Should pick first red voxel at index 2, not the one at 4
        });
    });
});

