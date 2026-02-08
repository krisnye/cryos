import { describe, it, expect } from "vitest";
import { Database } from "@adobe/data/ecs";
import { Line3, Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { gridWorld as gridWorld } from "./grid-world.js";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../../types/column-volume/column-volume.js";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import * as ColumnVolumeNamespace from "../../types/column-volume/public.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/public.js";

describe("gridWorld pick resource", () => {
    const { air, rock, steel, concrete } = Material.ids;

    /**
     * Helper to create a simple test chunk with a single solid voxel at a specific position
     */
    const createTestChunk = (solidX: number, solidY: number, solidZ: number, chunkSize: number = 16): ColumnVolume<PhysicalVoxel> => {
        // Create a dense volume with one solid voxel
        const size: Vec3 = [chunkSize, chunkSize, solidZ + 1];
        const capacity = size[0] * size[1] * size[2];
        const denseVolume: DenseVolume<PhysicalVoxel> = {
            type: "dense",
            size,
            data: createTypedBuffer(PhysicalVoxel.schema, capacity),
        };

        // Initialize all voxels to air
        for (let i = 0; i < capacity; i++) {
            denseVolume.data.set(i, PhysicalVoxel.pack(air));
        }

        // Set one solid voxel
        const index = DenseVolumeNamespace.getIndex(denseVolume, solidX, solidY, solidZ);
        denseVolume.data.set(index, PhysicalVoxel.pack(rock));

        // Convert to ColumnVolume
        return ColumnVolumeNamespace.create(denseVolume);
    };

    /**
     * Helper to create a chunk with a solid floor at z=0
     */
    const createFloorChunk = (chunkSize: number = 16, floorHeight: number = 1): ColumnVolume<PhysicalVoxel> => {
        const size: Vec3 = [chunkSize, chunkSize, floorHeight];
        const capacity = size[0] * size[1] * size[2];
        const denseVolume: DenseVolume<PhysicalVoxel> = {
            type: "dense",
            size,
            data: createTypedBuffer(PhysicalVoxel.schema, capacity),
        };

        // Fill bottom layer with rock
        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, 0);
                denseVolume.data.set(index, PhysicalVoxel.pack(rock));
            }
        }

        // Rest is air
        for (let z = 1; z < floorHeight; z++) {
            for (let y = 0; y < chunkSize; y++) {
                for (let x = 0; x < chunkSize; x++) {
                    const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, z);
                    denseVolume.data.set(index, air);
                }
            }
        }

        return ColumnVolumeNamespace.create(denseVolume);
    };

    describe("picking within a single chunk", () => {
        it("should pick a voxel from above", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create a chunk at (0, 0) with a solid voxel at model position (2, 2, 1)
            const chunk = createTestChunk(2, 2, 1, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: chunk,
            });

            // Pick from above the voxel
            // World position: chunk at (0, 0) + voxel at (2, 2) * blockSize = (8, 8) in world
            // Voxel is at z=1 in model space, so z=4 in world space (1 * blockSize)
            const line: Line3 = {
                a: [8, 8, 10], // Above the voxel
                b: [8, 8, 0],  // Through the voxel
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            expect(result?.entity).toBeDefined();
            // World position is exact surface hit (top face when picking from above)
            // Voxel at (2,2,1) model = world (8,8,4)..(12,12,8); ray enters top face at z=8
            expect(result?.worldPosition[0]).toBeCloseTo(8, 0.1);
            expect(result?.worldPosition[1]).toBeCloseTo(8, 0.1);
            expect(result?.worldPosition[2]).toBeCloseTo(8, 0.1);
            expect(result?.lineAlpha).toBeGreaterThanOrEqual(0);
            expect(result?.lineAlpha).toBeLessThanOrEqual(1);
        });

        it("should pick a voxel from the side", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create a chunk with a solid voxel at (5, 5, 2)
            const chunk = createTestChunk(5, 5, 2, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: chunk,
            });

            // Pick from the side (positive X direction)
            // Voxel world position: (5 * blockSize, 5 * blockSize, 2 * blockSize) = (20, 20, 8)
            const line: Line3 = {
                a: [0, 20, 8],  // Before the voxel
                b: [40, 20, 8], // Through the voxel
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // World position is exact surface hit (left face when picking from positive X)
            // Voxel at (5,5,2) model = world (20,20,8)..(24,24,12); ray enters left face at x=20
            expect(result?.worldPosition[0]).toBeCloseTo(20, 0.1);
            expect(result?.worldPosition[1]).toBeCloseTo(20, 0.1);
            expect(result?.worldPosition[2]).toBeCloseTo(8, 0.1);
        });

        it("should return null when picking through air", () => {
            const db = Database.create(gridWorld);
            const { chunkSize } = db.resources.worldScale;

            // Create an empty chunk (all air)
            const emptyChunk = createTestChunk(-1, -1, -1, chunkSize); // Invalid position = all air
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: emptyChunk,
            });

            const line: Line3 = {
                a: [0, 0, 10],
                b: [0, 0, 0],
            };

            const result = db.resources.pick(line);
            expect(result).toBeNull();
        });
    });

    describe("picking across multiple chunks", () => {
        it("should pick the closest chunk when line passes through multiple chunks", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create two chunks side by side
            // Chunk 0: solid voxel at (2, 2, 1) - world position (8, 8, 4)
            const chunk0 = createTestChunk(2, 2, 1, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: chunk0,
            });

            // Chunk 1: solid voxel at (2, 2, 1) - world position (chunkSize * blockSize + 8, 8, 4)
            const chunk1 = createTestChunk(2, 2, 1, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 1,
                chunkY: 0,
                volumeModel: chunk1,
            });

            // Pick from left to right, should hit chunk 0 first
            // Voxel is at z=1 (model) = z=4 (world), so line should pass through z=4
            const line: Line3 = {
                a: [0, 8, 4],   // Before chunk 0, at voxel height
                b: [200, 8, 4], // Through both chunks, at voxel height
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // Should pick chunk 0 (closer to line start)
            const chunk0Entity = (db.actions as any).getWorldChunkByIndex([0, 0]);
            expect(result?.entity).toBe(chunk0Entity);
            // Surface hit: voxel (2,2,1) = world (8,8,4)..(12,12,8); ray enters left face at x=8
            expect(result?.worldPosition[0]).toBeCloseTo(8, 0.1);
        });

        it("should pick from chunk at different Y coordinate", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create chunks at (0,0) and (0,1)
            const chunk00 = createTestChunk(2, 2, 1, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: chunk00,
            });

            const chunk01 = createTestChunk(2, 2, 1, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 1,
                volumeModel: chunk01,
            });

            // Pick from chunk (0,0) toward chunk (0,1)
            // Voxel is at z=1 (model) = z=4 (world), so line should pass through z=4
            const line: Line3 = {
                a: [8, 8, 4],           // In chunk (0,0), at voxel height
                b: [8, chunkSize * blockSize + 8, 4], // Through chunk (0,1), at voxel height
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // Should pick chunk (0,0) first (closer)
            const chunk00Entity = (db.actions as any).getWorldChunkByIndex([0, 0]);
            expect(result?.entity).toBe(chunk00Entity);
        });
    });

    describe("picking with floor chunks", () => {
        it("should pick the floor when picking straight down", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create a floor chunk with a known voxel position for easier testing
            // Use createTestChunk to create a floor voxel at (8, 8, 0)
            const floorChunk = createTestChunk(8, 8, 0, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: floorChunk,
            });

            // Pick straight down through the known voxel position
            // Voxel at (8, 8, 0) in model space = (32, 32, 0) in world space
            const line: Line3 = {
                a: [8 * blockSize, 8 * blockSize, 5], // Above the voxel
                b: [8 * blockSize, 8 * blockSize, -1],  // Through the voxel
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // Should hit the floor voxel at (8, 8, 0) in model space
            // Surface hit: voxel (32,32,0)..(36,36,4); ray from above enters top face at z=4
            expect(result?.worldPosition[0]).toBeCloseTo(8 * blockSize, 0.1);
            expect(result?.worldPosition[1]).toBeCloseTo(8 * blockSize, 0.1);
            expect(result?.worldPosition[2]).toBeCloseTo(4, 0.1);
        });

        it("should pick floor at chunk boundary", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create two floor chunks side by side with known voxel positions
            // Chunk 0: floor voxel at (15, 8, 0) - near the right edge
            const floorChunk0 = createTestChunk(15, 8, 0, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: floorChunk0,
            });

            // Chunk 1: floor voxel at (0, 8, 0) - near the left edge
            const floorChunk1 = createTestChunk(0, 8, 0, chunkSize);
            db.transactions.createWorldChunk({
                chunkX: 1,
                chunkY: 0,
                volumeModel: floorChunk1,
            });

            // Pick at the boundary between chunks (chunk 0 ends at x=chunkSize*blockSize)
            // Pick through chunk 0's floor voxel
            const boundaryX = chunkSize * blockSize;
            const line: Line3 = {
                a: [15 * blockSize, 8 * blockSize, 5], // Through chunk 0's floor voxel
                b: [15 * blockSize, 8 * blockSize, -1],
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // Should hit chunk 0's floor voxel - surface hit at top face z=4
            expect(result?.worldPosition[2]).toBeCloseTo(4, 0.1);
        });
    });

    describe("edge cases", () => {
        it("should return null when line doesn't intersect any chunks", () => {
            const db = Database.create(gridWorld);

            // Create a chunk at (0, 0)
            const chunk = createTestChunk(2, 2, 1, 16);
            db.transactions.createWorldChunk({
                chunkX: 0,
                chunkY: 0,
                volumeModel: chunk,
            });

            // Pick far away from any chunks
            const line: Line3 = {
                a: [1000, 1000, 10],
                b: [1000, 1000, 0],
            };

            const result = db.resources.pick(line);
            expect(result).toBeNull();
        });

        it("should handle diagonal picks across chunks", () => {
            const db = Database.create(gridWorld);
            const { chunkSize, blockSize } = db.resources.worldScale;

            // Create chunks in a 2x2 grid
            for (let chunkY = 0; chunkY < 2; chunkY++) {
                for (let chunkX = 0; chunkX < 2; chunkX++) {
                    const chunk = createTestChunk(8, 8, 1, chunkSize);
                    db.transactions.createWorldChunk({
                        chunkX,
                        chunkY,
                        volumeModel: chunk,
                    });
                }
            }

            // Pick diagonally from corner to corner
            // Voxels are at z=1 (model) = z=4 (world), so line should pass through z=4
            const line: Line3 = {
                a: [0, 0, 4],
                b: [chunkSize * blockSize * 2, chunkSize * blockSize * 2, 4],
            };

            const result = db.resources.pick(line);

            expect(result).not.toBeNull();
            // Should pick one of the chunks
            expect(result?.entity).toBeDefined();
        });
    });
});

