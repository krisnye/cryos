// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { MaterialId } from "../material/material-id.js";
import { ColumnVolume } from "./column-volume.js";
import { tileIndex } from "./tile-index.js";

describe("tileIndex", () => {
    it("should calculate tile index correctly", () => {
        const volume: ColumnVolume<MaterialId> = {
            type: "column",
            size: [4, 3, 5],
            tile: new Uint32Array(12), // 4 * 3 = 12
            data: createTypedBuffer(MaterialId.schema, 0),
        };

        // Test various positions
        expect(tileIndex(volume, 0, 0)).toBe(0); // 0 + 0 * 4 = 0
        expect(tileIndex(volume, 1, 0)).toBe(1); // 1 + 0 * 4 = 1
        expect(tileIndex(volume, 0, 1)).toBe(4); // 0 + 1 * 4 = 4
        expect(tileIndex(volume, 3, 2)).toBe(11); // 3 + 2 * 4 = 11
    });

    it("should work with different volume sizes", () => {
        const volume1: ColumnVolume<MaterialId> = {
            type: "column",
            size: [2, 2, 2],
            tile: new Uint32Array(4),
            data: createTypedBuffer(MaterialId.schema, 0),
        };

        expect(tileIndex(volume1, 0, 0)).toBe(0);
        expect(tileIndex(volume1, 1, 0)).toBe(1);
        expect(tileIndex(volume1, 0, 1)).toBe(2);
        expect(tileIndex(volume1, 1, 1)).toBe(3);

        const volume2: ColumnVolume<MaterialId> = {
            type: "column",
            size: [10, 5, 8],
            tile: new Uint32Array(50), // 10 * 5 = 50
            data: createTypedBuffer(MaterialId.schema, 0),
        };

        expect(tileIndex(volume2, 5, 3)).toBe(35); // 5 + 3 * 10 = 35
    });
});

