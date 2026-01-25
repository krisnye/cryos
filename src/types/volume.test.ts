// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { DenseVolume } from "./dense-volume/dense-volume.js";
import { ColumnVolume } from "./column-volume/column-volume.js";
import { Material } from "./index.js";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { ColumnInfo } from "./column-volume/column-info/column-info.js";

describe("Volume type guards", () => {
    describe("DenseVolume.is", () => {
        it("should return true for DenseVolume", () => {
            const volume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(Material.Id.schema, 1),
            };
            expect(DenseVolume.is(volume)).toBe(true);
        });

        it("should return false for ColumnVolume", () => {
            const volume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [1, 1, 1],
                tile: new Uint32Array([ColumnInfo.pack(0, 0, 0)]),
                data: createTypedBuffer(Material.Id.schema, 0),
            };
            expect(DenseVolume.is(volume)).toBe(false);
        });
    });

    describe("ColumnVolume.is", () => {
        it("should return true for ColumnVolume", () => {
            const volume: ColumnVolume<Material.Id> = {
                type: "column",
                size: [1, 1, 1],
                tile: new Uint32Array([ColumnInfo.pack(0, 0, 0)]),
                data: createTypedBuffer(Material.Id.schema, 0),
            };
            expect(ColumnVolume.is(volume)).toBe(true);
        });

        it("should return false for DenseVolume", () => {
            const volume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [1, 1, 1],
                data: createTypedBuffer(Material.Id.schema, 1),
            };
            expect(ColumnVolume.is(volume)).toBe(false);
        });
    });
});

