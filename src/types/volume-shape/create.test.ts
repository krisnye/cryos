import { describe, expect, it } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Aabb } from "types/aabb/index.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "../column-volume/column-volume.js";
import { VolumeShape } from "./volume-shape.js";
import { Voxel } from "./voxel/voxel.js";

describe("VolumeShape.create", () => {
    it("marks boundary, FULL, and INTERIOR for a solid box", () => {
        const size = [3, 3, 3] as const;
        const capacity = size[0] * size[1] * size[2];
        const data = createTypedBuffer({ type: "boolean", default: false }, capacity);
        for (let i = 0; i < capacity; i++) {
            data.set(i, true);
        }
        const volume: DenseVolume<boolean> = {
            type: "dense",
            size,
            data,
        };

        const shape = VolumeShape.create(volume);

        const center = DenseVolume.getIndex(shape, 1, 1, 1);
        expect(shape.data.get(center)).toBe(Voxel.FULL | Voxel.INTERIOR);

        const corner = DenseVolume.getIndex(shape, 0, 0, 0);
        expect(shape.data.get(corner)).toBe(
            Aabb.Face.NEG_X | Aabb.Face.NEG_Y | Aabb.Face.NEG_Z | Voxel.FULL
        );
    });

    it("sets boundary bits without FULL for empty cells", () => {
        const size = [2, 2, 2] as const;
        const capacity = 8;
        const data = createTypedBuffer({ type: "boolean", default: false }, capacity);
        const volume: DenseVolume<boolean> = {
            type: "dense",
            size,
            data,
        };

        const shape = VolumeShape.create(volume);
        const corner = DenseVolume.getIndex(shape, 0, 0, 0);
        expect(shape.data.get(corner)).toBe(Aabb.Face.NEG_X | Aabb.Face.NEG_Y | Aabb.Face.NEG_Z);
    });

    it("works for ColumnVolume<boolean> from dense conversion", () => {
        const size = [2, 2, 2] as const;
        const capacity = 8;
        const data = createTypedBuffer({ type: "boolean", default: false }, capacity);
        for (let i = 0; i < capacity; i++) {
            data.set(i, true);
        }
        const occupancy: DenseVolume<boolean> = {
            type: "dense",
            size,
            data,
        };

        const column = ColumnVolume.create(occupancy);
        const shape = VolumeShape.create(column);

        expect(shape.type).toBe("dense");
        expect(shape.size).toEqual(column.size);
        expect(shape.data.capacity).toBe(column.size[0] * column.size[1] * column.size[2]);
    });
});
