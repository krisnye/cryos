// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "./dense-volume.js";
import { MaterialId } from "../material/material-id.js";
import { Material } from "../index.js";
import { equals } from "./equals.js";
import * as DenseVolumeNamespace from "./namespace.js";

describe("DenseVolume.equals", () => {
    describe("same reference", () => {
        it("should return true for identical references", () => {
            const volume: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            expect(equals(volume, volume)).toBe(true);
        });
    });

    describe("structural differences", () => {
        it("should return false for different sizes", () => {
            const volume1: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            const volume2: DenseVolume<MaterialId> = {
                type: "dense",
                size: [3, 3, 3],
                data: createTypedBuffer(MaterialId.schema, 27),
            };

            expect(equals(volume1, volume2)).toBe(false);
        });

        it("should return false for different data", () => {
            const volume1: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            const volume2: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            volume1.data.set(0, Material.id.concrete);
            volume2.data.set(0, Material.id.steel);

            expect(equals(volume1, volume2)).toBe(false);
        });
    });

    describe("identical volumes", () => {
        it("should return true for volumes with same size and data", () => {
            const volume1: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            const volume2: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // Set same values
            volume1.data.set(0, Material.id.concrete);
            volume1.data.set(1, Material.id.steel);
            volume2.data.set(0, Material.id.concrete);
            volume2.data.set(1, Material.id.steel);

            expect(equals(volume1, volume2)).toBe(true);
        });

        it("should return true for empty volumes", () => {
            const volume1: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            const volume2: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // Both are empty (all defaults)
            expect(equals(volume1, volume2)).toBe(true);
        });

        it("should return true for fully dense volumes with same data", () => {
            const volume1: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            const volume2: DenseVolume<MaterialId> = {
                type: "dense",
                size: [2, 2, 2],
                data: createTypedBuffer(MaterialId.schema, 8),
            };

            // Fill both with same material
            for (let i = 0; i < 8; i++) {
                volume1.data.set(i, Material.id.concrete);
                volume2.data.set(i, Material.id.concrete);
            }

            expect(equals(volume1, volume2)).toBe(true);
        });
    });
});

