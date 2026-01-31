import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Line3 } from "@adobe/data/math";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "../column-volume/column-volume.js";
import { Material } from "../material/material.js";
import { create as createColumnVolume } from "../column-volume/create.js";
import { pick } from "./pick.js";

describe("Volume.pick", () => {
    const { air, rock, steel } = Material.ids;

    describe("picking from DenseVolume", () => {
        it("should pick from dense volume", () => {
            const data = [air, air, rock, air, air];
            const volume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(Material.Id.schema, data)
            };

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, (voxel) => voxel !== air);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]);
        });
    });

    describe("picking from ColumnVolume", () => {
        it("should pick from column volume", () => {
            const data = [air, air, rock, air, air];
            const denseVolume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [5, 1, 1],
                data: createTypedBuffer(Material.Id.schema, data)
            };
            const volume = createColumnVolume(denseVolume);

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(volume, line, (voxel) => voxel !== air);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([2, 0, 0]);
        });
    });

    describe("type dispatch", () => {
        it("should call correct implementation for dense volume", () => {
            const data = [air, steel, air];
            const denseVolume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [3, 1, 1],
                data: createTypedBuffer(Material.Id.schema, data)
            };

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(denseVolume, line, (voxel) => voxel !== air);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 0, 0]);
        });

        it("should call correct implementation for column volume", () => {
            const data = [air, steel, air];
            const denseVolume: DenseVolume<Material.Id> = {
                type: "dense",
                size: [3, 1, 1],
                data: createTypedBuffer(Material.Id.schema, data)
            };
            const columnVolume = createColumnVolume(denseVolume);

            const line: Line3 = {
                a: [-1, 0.5, 0.5],
                b: [10, 0.5, 0.5]
            };

            const result = pick(columnVolume, line, (voxel) => voxel !== air);
            
            expect(result).not.toBeNull();
            expect(result?.coordinates).toEqual([1, 0, 0]);
        });
    });
});

