// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "./column-volume.js";
import { MaterialId } from "../material/material-id.js";
import { Material } from "../index.js";
import { toDenseVolume } from "./to-dense-volume.js";
import { create } from "./create.js";
import * as ColumnVolumeNamespace from "./namespace.js";
import * as DenseVolumeNamespace from "../dense-volume/namespace.js";
import { EMPTY_COLUMN, packColumnInfo } from "./column-info.js";

describe("toDenseVolume", () => {
    describe("empty volume", () => {
        it("should produce DenseVolume with all defaults for empty ColumnVolume", () => {
            const columnVolume: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            // All tiles are empty
            columnVolume.tile.fill(EMPTY_COLUMN);

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([2, 2, 2]);
            expect(result.data.capacity).toBe(8);

            // All voxels should be default (0 for MaterialId)
            for (let i = 0; i < 8; i++) {
                expect(result.data.get(i)).toBe(0);
            }
        });
    });

    describe("fully dense volume", () => {
        it("should produce DenseVolume with all voxels for fully dense ColumnVolume", () => {
            const data = createTypedBuffer(MaterialId.schema, 8);
            for (let i = 0; i < 8; i++) {
                data.set(i, Material.id.concrete);
            }

            const columnVolume: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data,
            };

            // All columns have data
            columnVolume.tile[0] = packColumnInfo(0, 2, 0); // (0,0): offset 0, length 2, zStart 0
            columnVolume.tile[1] = packColumnInfo(2, 2, 0); // (1,0): offset 2, length 2, zStart 0
            columnVolume.tile[2] = packColumnInfo(4, 2, 0); // (0,1): offset 4, length 2, zStart 0
            columnVolume.tile[3] = packColumnInfo(6, 2, 0); // (1,1): offset 6, length 2, zStart 0

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([2, 2, 2]);
            expect(result.data.capacity).toBe(8);

            // All voxels should be concrete
            for (let i = 0; i < 8; i++) {
                expect(result.data.get(i)).toBe(Material.id.concrete);
            }
        });
    });

    describe("sparse volume", () => {
        it("should produce DenseVolume with defaults for empty columns", () => {
            const data = createTypedBuffer(MaterialId.schema, 3);
            data.set(0, Material.id.concrete);
            data.set(1, Material.id.concrete);
            data.set(2, Material.id.concrete);

            const columnVolume: ColumnVolume<MaterialId> = {
                type: "column",
                size: [3, 3, 3],
                tile: new Uint32Array(9),
                data,
            };

            // Only column (1,1) has data
            columnVolume.tile.fill(EMPTY_COLUMN);
            const tileIdx = 1 + 1 * 3;
            columnVolume.tile[tileIdx] = packColumnInfo(0, 3, 0);

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([3, 3, 3]);

            // Check that column (1,1) has concrete
            expect(result.data.get(DenseVolumeNamespace.index(result, 1, 1, 0))).toBe(Material.id.concrete);
            expect(result.data.get(DenseVolumeNamespace.index(result, 1, 1, 1))).toBe(Material.id.concrete);
            expect(result.data.get(DenseVolumeNamespace.index(result, 1, 1, 2))).toBe(Material.id.concrete);

            // Check that other columns are default (0)
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 0))).toBe(0);
            expect(result.data.get(DenseVolumeNamespace.index(result, 2, 2, 2))).toBe(0);
        });

        it("should handle column starting at non-zero z", () => {
            const data = createTypedBuffer(MaterialId.schema, 3);
            data.set(0, Material.id.concrete);
            data.set(1, Material.id.concrete);
            data.set(2, Material.id.concrete);

            const columnVolume: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 5],
                tile: new Uint32Array(4),
                data,
            };

            // Column (0,0) starts at z=2 with 3 voxels
            columnVolume.tile.fill(EMPTY_COLUMN);
            columnVolume.tile[0] = packColumnInfo(0, 3, 2);

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([2, 2, 5]);

            // Check z=0,1 are default
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 0))).toBe(0);
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 1))).toBe(0);

            // Check z=2,3,4 are concrete
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 2))).toBe(Material.id.concrete);
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 3))).toBe(Material.id.concrete);
            expect(result.data.get(DenseVolumeNamespace.index(result, 0, 0, 4))).toBe(Material.id.concrete);
        });
    });

    describe("round-trip conversion", () => {
        it("should preserve non-empty voxels in DenseVolume → ColumnVolume → DenseVolume", () => {
            const original: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 3],
                data: createTypedBuffer(MaterialId.schema, 12),
            };

            const { concrete, steel, woodHard, rock, iron } = Material.id;

            // Fill with specific materials
            original.data.set(DenseVolumeNamespace.index(original, 0, 0, 0), concrete);
            original.data.set(DenseVolumeNamespace.index(original, 0, 0, 1), steel);
            original.data.set(DenseVolumeNamespace.index(original, 1, 0, 0), woodHard);
            original.data.set(DenseVolumeNamespace.index(original, 1, 0, 1), rock);
            original.data.set(DenseVolumeNamespace.index(original, 1, 0, 2), iron);

            // Round-trip conversion
            const column = create(original);
            const result = toDenseVolume(column);

            // Verify using DenseVolume.equals
            expect(DenseVolumeNamespace.equals(original, result)).toBe(true);
        });

        it("should produce equivalent ColumnVolume in ColumnVolume → DenseVolume → ColumnVolume", () => {
            const original: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 3],
                data: createTypedBuffer(MaterialId.schema, 12),
            };

            const { concrete, steel } = Material.id;

            // Fill column (0,0) with materials
            original.data.set(DenseVolumeNamespace.index(original, 0, 0, 0), concrete);
            original.data.set(DenseVolumeNamespace.index(original, 0, 0, 1), steel);

            // Create column volume
            const column1 = create(original);

            // Round-trip conversion
            const dense = toDenseVolume(column1);
            const column2 = create(dense);

            // Verify using ColumnVolume.equals
            expect(ColumnVolumeNamespace.equals(column1, column2)).toBe(true);
        });
    });
});

