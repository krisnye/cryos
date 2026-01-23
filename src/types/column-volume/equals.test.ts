// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { ColumnVolume } from "./column-volume.js";
import { MaterialId } from "../material/material-id.js";
import { Material } from "../index.js";
import { equals } from "./equals.js";
import { EMPTY_COLUMN, packColumnInfo } from "./column-info.js";

describe("ColumnVolume.equals", () => {
    describe("same reference", () => {
        it("should return true for identical references", () => {
            const volume: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            expect(equals(volume, volume)).toBe(true);
        });
    });

    describe("structural differences", () => {
        it("should return false for different sizes", () => {
            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [3, 3, 3],
                tile: new Uint32Array(9),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            expect(equals(volume1, volume2)).toBe(false);
        });

        it("should return false for different tile arrays", () => {
            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            volume1.tile[0] = packColumnInfo(0, 2, 0);
            volume2.tile[0] = EMPTY_COLUMN;

            expect(equals(volume1, volume2)).toBe(false);
        });

        it("should return false for different data", () => {
            const data1 = createTypedBuffer(MaterialId.schema, 2);
            const data2 = createTypedBuffer(MaterialId.schema, 2);

            data1.set(0, Material.id.concrete);
            data2.set(0, Material.id.steel);

            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: data1,
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: data2,
            };

            // Set same tile structure
            volume1.tile[0] = packColumnInfo(0, 2, 0);
            volume2.tile[0] = packColumnInfo(0, 2, 0);

            expect(equals(volume1, volume2)).toBe(false);
        });
    });

    describe("identical volumes", () => {
        it("should return true for volumes with same size, tile, and data", () => {
            const data1 = createTypedBuffer(MaterialId.schema, 4);
            const data2 = createTypedBuffer(MaterialId.schema, 4);

            data1.set(0, Material.id.concrete);
            data1.set(1, Material.id.steel);
            data2.set(0, Material.id.concrete);
            data2.set(1, Material.id.steel);

            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: data1,
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 2],
                tile: new Uint32Array(4),
                data: data2,
            };

            // Set same tile structure
            volume1.tile[0] = packColumnInfo(0, 2, 0);
            volume2.tile[0] = packColumnInfo(0, 2, 0);

            expect(equals(volume1, volume2)).toBe(true);
        });

        it("should return true for empty volumes", () => {
            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 0],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 0],
                tile: new Uint32Array(4),
                data: createTypedBuffer(MaterialId.schema, 0),
            };

            // Both have all EMPTY_COLUMN
            volume1.tile.fill(EMPTY_COLUMN);
            volume2.tile.fill(EMPTY_COLUMN);

            expect(equals(volume1, volume2)).toBe(true);
        });

        it("should return true for volumes with same column structure", () => {
            const data1 = createTypedBuffer(MaterialId.schema, 6);
            const data2 = createTypedBuffer(MaterialId.schema, 6);

            // Fill with same values
            for (let i = 0; i < 6; i++) {
                data1.set(i, Material.id.concrete);
                data2.set(i, Material.id.concrete);
            }

            const volume1: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 3],
                tile: new Uint32Array(4),
                data: data1,
            };

            const volume2: ColumnVolume<MaterialId> = {
                type: "column",
                size: [2, 2, 3],
                tile: new Uint32Array(4),
                data: data2,
            };

            // Set same tile structure for all columns
            volume1.tile[0] = packColumnInfo(0, 3, 0);
            volume1.tile[1] = packColumnInfo(3, 3, 0);
            volume2.tile[0] = packColumnInfo(0, 3, 0);
            volume2.tile[1] = packColumnInfo(3, 3, 0);

            expect(equals(volume1, volume2)).toBe(true);
        });
    });
});

