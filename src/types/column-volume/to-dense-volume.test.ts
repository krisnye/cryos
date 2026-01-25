// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Material } from "../index.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "./column-volume.js";
import { toDenseVolume } from "./to-dense-volume.js";
import { create } from "./create.js";
import * as ColumnVolumeNamespace from "./namespace.js";
import * as DenseVolumeNamespace from "../dense-volume/namespace.js";
import { ColumnInfo } from "./column-info/column-info.js";

describe("toDenseVolume", () => {
    describe("empty volume", () => {
        it("should produce DenseVolume with all defaults for empty ColumnVolume", () => {
            const columnVolume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(Material.Id.schema, 0),
            };

            // All tiles are empty
            columnVolume.tile.fill(0);

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
            const data = createTypedBuffer(Material.Id.schema, 8);
            for (let i = 0; i < 8; i++) {
                data.set(i, Material.ids.concrete);
            }

            const columnVolume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data,
            };

            // All columns have data
            columnVolume.tile[0] = ColumnInfo.pack(0, 2, 0); // (0,0): offset 0, length 2, zStart 0
            columnVolume.tile[1] = ColumnInfo.pack(2, 2, 0); // (1,0): offset 2, length 2, zStart 0
            columnVolume.tile[2] = ColumnInfo.pack(4, 2, 0); // (0,1): offset 4, length 2, zStart 0
            columnVolume.tile[3] = ColumnInfo.pack(6, 2, 0); // (1,1): offset 6, length 2, zStart 0

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([2, 2, 2]);
            expect(result.data.capacity).toBe(8);

            // All voxels should be concrete
            for (let i = 0; i < 8; i++) {
                expect(result.data.get(i)).toBe(Material.ids.concrete);
            }
        });
    });

    describe("sparse volume", () => {
        it("should produce DenseVolume with defaults for empty columns", () => {
            const data = createTypedBuffer(Material.Id.schema, 3);
            data.set(0, Material.ids.concrete);
            data.set(1, Material.ids.concrete);
            data.set(2, Material.ids.concrete);

            const columnVolume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [3, 3, 3],
                tile: new Uint32Array(9),
                data,
            };

            // Only column (1,1) has data
            columnVolume.tile.fill(0);
            const tileIdx = 1 + 1 * 3;
            columnVolume.tile[tileIdx] = ColumnInfo.pack(0, 3, 0);

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([3, 3, 3]);

            // Check that column (1,1) has concrete
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 1, 1, 0))).toBe(Material.ids.concrete);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 1, 1, 1))).toBe(Material.ids.concrete);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 1, 1, 2))).toBe(Material.ids.concrete);

            // Check that other columns are default (0)
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 0))).toBe(0);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 2, 2, 2))).toBe(0);
        });

        it("should handle column starting at non-zero z", () => {
            const data = createTypedBuffer(Material.Id.schema, 3);
            data.set(0, Material.ids.concrete);
            data.set(1, Material.ids.concrete);
            data.set(2, Material.ids.concrete);

            const columnVolume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [2, 2, 5],
                tile: new Uint32Array(4),
                data,
            };

            // Column (0,0) starts at z=2 with 3 voxels
            columnVolume.tile.fill(0);
            columnVolume.tile[0] = ColumnInfo.pack(0, 3, 2);

            const result = toDenseVolume(columnVolume);

            expect(result.type).toBe("dense");
            expect(result.size).toEqual([2, 2, 5]);

            // Check z=0,1 are default
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 0))).toBe(0);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 1))).toBe(0);

            // Check z=2,3,4 are concrete
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 2))).toBe(Material.ids.concrete);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 3))).toBe(Material.ids.concrete);
            expect(result.data.get(DenseVolumeNamespace.getIndex(result, 0, 0, 4))).toBe(Material.ids.concrete);
        });
    });

    describe("round-trip conversion", () => {
        it("should preserve non-empty voxels in DenseVolume → ColumnVolume → DenseVolume", () => {
            const original: DenseVolume<Material.Id> = {
                type: "dense",
                size: [2, 2, 3],
                data: createTypedBuffer(Material.Id.schema, 12),
            };

            const { concrete, steel, woodHard, rock, iron } = Material.ids;

            // Fill with specific materials
            original.data.set(DenseVolumeNamespace.getIndex(original, 0, 0, 0), concrete);
            original.data.set(DenseVolumeNamespace.getIndex(original, 0, 0, 1), steel);
            original.data.set(DenseVolumeNamespace.getIndex(original, 1, 0, 0), woodHard);
            original.data.set(DenseVolumeNamespace.getIndex(original, 1, 0, 1), rock);
            original.data.set(DenseVolumeNamespace.getIndex(original, 1, 0, 2), iron);

            // Round-trip conversion
            const column = create(original);
            const result = toDenseVolume(column);

            // Verify using DenseVolume.equals
            expect(DenseVolumeNamespace.equals(original, result)).toBe(true);
        });

        it("should produce equivalent ColumnVolume in ColumnVolume → DenseVolume → ColumnVolume", () => {
            const original: DenseVolume<Material.Id> = {
                type: "dense",
                size: [2, 2, 3],
                data: createTypedBuffer(Material.Id.schema, 12),
            };

            const { concrete, steel } = Material.ids;

            // Fill column (0,0) with materials
            original.data.set(DenseVolumeNamespace.getIndex(original, 0, 0, 0), concrete);
            original.data.set(DenseVolumeNamespace.getIndex(original, 0, 0, 1), steel);

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

