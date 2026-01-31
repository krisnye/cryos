// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { MaterialId } from "../material/material-id.js";
import { Material } from "../index.js";
import { create } from "./create.js";
import * as ColumnVolume from "./namespace.js";
import * as DenseVolumeNamespace from "../dense-volume/namespace.js";
import { EMPTY_COLUMN } from "./column-info.js";

describe("create", () => {
    describe("schema.default validation", () => {
        it("should throw error when schema.default is not defined for array buffers", () => {
            // Create an array buffer without schema.default
            const schema = { type: "string" as const };
            const buffer = createTypedBuffer(schema, 8);
            const volume: DenseVolume<string> = {
                type: "dense",
                size: [2, 2, 2],
                data: buffer,
            };

            expect(() => {
                create(volume);
            }).toThrow("DenseVolume schema must have a default value");
        });

        it("should proceed when schema.default is defined", () => {
            const schema = { type: "number" as const, default: 0 };
            const buffer = createTypedBuffer(schema, 8);
            const volume: DenseVolume<number> = {
                type: "dense",
                size: [2, 2, 2],
                data: buffer,
            };

            // Should not throw
            const result = create(volume);
            expect(result.type).toBe("column");
        });

        it("should work with MaterialId schema (TypedArray default is 0)", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // MaterialId uses I32.schema, which is TypedArray-backed (default is 0)
            // This should work because TypedArray buffers have implicit default of 0
            const result = create(volume);
            expect(result.type).toBe("column");
        });
    });

    describe("empty volume", () => {
        it("should produce column volume with no data for all-empty volume", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // All voxels are 0 (air/default)
            const result = create(volume);

            expect(result.type).toBe("column");
            expect(result.size).toEqual([2, 2, 0]); // z should be 0 for all empty
            expect(result.data.capacity).toBe(0); // No data
            expect(result.tile.length).toBe(4); // 2x2 = 4 tiles

            // All tiles should be empty
            for (let i = 0; i < result.tile.length; i++) {
                expect(result.tile[i]).toBe(EMPTY_COLUMN);
            }
        });
    });

    describe("fully dense volume", () => {
        it("should produce column volume with all columns for fully dense volume", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // Fill all voxels with non-zero material
            for (let i = 0; i < 8; i++) {
                volume.data.set(i, Material.id.concrete);
            }

            const result = create(volume);

            expect(result.type).toBe("column");
            expect(result.size).toEqual([2, 2, 2]); // z matches input
            expect(result.data.capacity).toBe(8); // All 8 voxels stored
            expect(result.tile.length).toBe(4); // 2x2 = 4 tiles

            // Verify each tile has correct ColumnInfo
            // For a 2x2x2 fully dense volume, each column has 2 voxels
            // Tile indices: (0,0)=0, (1,0)=1, (0,1)=2, (1,1)=3
            // Data offsets: 0, 2, 4, 6 (each column has 2 voxels)
            const expectedColumns = [
                { x: 0, y: 0, dataOffset: 0, length: 2, zStart: 0 },
                { x: 1, y: 0, dataOffset: 2, length: 2, zStart: 0 },
                { x: 0, y: 1, dataOffset: 4, length: 2, zStart: 0 },
                { x: 1, y: 1, dataOffset: 6, length: 2, zStart: 0 },
            ];

            for (const expected of expectedColumns) {
                const tileIdx = expected.x + expected.y * 2;
                const columnInfo = result.tile[tileIdx];
                expect(columnInfo).not.toBe(EMPTY_COLUMN);

                const unpacked = ColumnVolume.unpackColumnInfo(columnInfo);
                expect(unpacked.dataOffset).toBe(expected.dataOffset);
                expect(unpacked.length).toBe(expected.length);
                expect(unpacked.zStart).toBe(expected.zStart);
            }
        });
    });

    describe("sparse volume", () => {
        it("should only store non-empty columns", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(MaterialId.schema, 27),
            };

            // Only fill column at (1,1) with material
            // Column (1,1) has voxels at z=0,1,2
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 0), Material.id.concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 1), Material.id.concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 2), Material.id.concrete);

            const result = create(volume);

            expect(result.type).toBe("column");
            expect(result.size).toEqual([3, 3, 3]); // z matches max column height
            expect(result.data.capacity).toBe(3); // Only 3 voxels stored

            // Check that only (1,1) column has data
            const tileIdx = 1 + 1 * 3; // x + y * width
            expect(result.tile[tileIdx]).not.toBe(EMPTY_COLUMN);

            // All other tiles should be empty
            for (let i = 0; i < result.tile.length; i++) {
                if (i !== tileIdx) {
                    expect(result.tile[i]).toBe(EMPTY_COLUMN);
                }
            }
        });

        it("should handle column starting at non-zero z", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 5],
                data: createTypedBuffer(MaterialId.schema, 20),
            };

            // Column (0,0) has voxels only at z=2,3,4
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 2), Material.id.concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 3), Material.id.concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 4), Material.id.concrete);

            const result = create(volume);

            expect(result.type).toBe("column");
            expect(result.size).toEqual([2, 2, 5]); // z matches max (zStart + length)
            expect(result.data.capacity).toBe(3); // Only 3 voxels stored

            // Check column info for (0,0)
            const tileIdx = 0 + 0 * 2;
            const columnInfo = result.tile[tileIdx];
            expect(columnInfo).not.toBe(EMPTY_COLUMN);

            const unpacked = ColumnVolume.unpackColumnInfo(columnInfo);
            expect(unpacked.zStart).toBe(2); // Column starts at z=2
            expect(unpacked.length).toBe(3); // Column has 3 voxels
        });
    });

    describe("column bounds detection", () => {
        it("should include gaps between non-empty voxels in column", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [1, 1, 5],
                data: createTypedBuffer(MaterialId.schema, 5),
            };

            // Column has voxels at z=0 and z=4, with gaps at z=1,2,3
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 0), Material.id.concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 4), Material.id.concrete);

            const result = create(volume);

            // Should include all voxels from z=0 to z=4 (including gaps)
            expect(result.data.capacity).toBe(5); // All 5 voxels stored

            const tileIdx = 0 + 0 * 1;
            const unpacked = ColumnVolume.unpackColumnInfo(result.tile[tileIdx]);
            expect(unpacked.zStart).toBe(0);
            expect(unpacked.length).toBe(5); // Full range from 0 to 4
        });
    });

    describe("data correctness verification", () => {
        it("should preserve exact voxel values in conversion", () => {
            // Create a simple 2x2x3 volume with known values
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 3],
                data: createTypedBuffer(MaterialId.schema, 12),
            };

            // Fill with specific materials at known positions
            const { air, concrete, steel, woodHard, rock, iron } = Material.id;
            
            // Column (0,0): concrete at z=0, steel at z=1, air at z=2
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 0), concrete);
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 1), steel);
            volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 2), air);

            // Column (1,0): woodHard at z=0, rock at z=1, iron at z=2
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 0), woodHard);
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 1), rock);
            volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 2), iron);

            // Columns (0,1) and (1,1) are all air (empty)

            const result = create(volume);

            // Verify structure
            expect(result.type).toBe("column");
            expect(result.size).toEqual([2, 2, 3]);
            // Column (0,0): z=0,1 (air at z=2 is default, so not included) = 2 voxels
            // Column (1,0): z=0,1,2 = 3 voxels
            // Total: 5 voxels
            expect(result.data.capacity).toBe(5);

            // Verify column (0,0) data (ends at z=1 because z=2 is air/default)
            const tileIdx00 = 0 + 0 * 2;
            const info00 = ColumnVolume.unpackColumnInfo(result.tile[tileIdx00]);
            expect(info00.zStart).toBe(0);
            expect(info00.length).toBe(2); // Only z=0,1 (z=2 is default/empty)
            expect(result.data.get(info00.dataOffset + 0)).toBe(concrete);
            expect(result.data.get(info00.dataOffset + 1)).toBe(steel);

            // Verify column (1,0) data
            const tileIdx10 = 1 + 0 * 2;
            const info10 = ColumnVolume.unpackColumnInfo(result.tile[tileIdx10]);
            expect(info10.zStart).toBe(0);
            expect(info10.length).toBe(3);
            expect(result.data.get(info10.dataOffset + 0)).toBe(woodHard);
            expect(result.data.get(info10.dataOffset + 1)).toBe(rock);
            expect(result.data.get(info10.dataOffset + 2)).toBe(iron);

            // Verify empty columns
            const tileIdx01 = 0 + 1 * 2;
            const tileIdx11 = 1 + 1 * 2;
            expect(result.tile[tileIdx01]).toBe(EMPTY_COLUMN);
            expect(result.tile[tileIdx11]).toBe(EMPTY_COLUMN);
        });

        it("should correctly pack and unpack ColumnInfo", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 10],
                data: createTypedBuffer(MaterialId.schema, 40),
            };

            // Column (0,0) starts at z=3 with 5 voxels
            for (let z = 3; z < 8; z++) {
                volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, z), Material.id.concrete);
            }

            const result = create(volume);

            const tileIdx = 0 + 0 * 2;
            const columnInfo = result.tile[tileIdx];
            
            // Verify packed info
            const unpacked = ColumnVolume.unpackColumnInfo(columnInfo);
            expect(unpacked.zStart).toBe(3);
            expect(unpacked.length).toBe(5);
            expect(unpacked.dataOffset).toBe(0); // First column

            // Verify we can round-trip pack/unpack
            const repacked = ColumnVolume.packColumnInfo(unpacked.dataOffset, unpacked.length, unpacked.zStart);
            expect(repacked).toBe(columnInfo);
        });
    });
});

