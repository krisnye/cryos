import { describe, it, expect } from "vitest";
import { Database } from "@adobe/data/ecs";
import { Line3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { volumeModel } from "./volume-model.js";
import { graphics } from "../graphics.js";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../../types/column-volume/column-volume.js";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import { pickVolumeModels } from "./pick-volume-models.js";

describe("pickVolumeModels", () => {
    const { air, rock } = Material.ids;

    const createTestChunk = (solidX: number, solidY: number, solidZ: number): ColumnVolume<PhysicalVoxel> => {
        const size = [16, 16, solidZ + 1] as const;
        const capacity = size[0] * size[1] * size[2];
        const denseVolume: DenseVolume<PhysicalVoxel> = {
            type: "dense",
            size: [...size],
            data: createTypedBuffer(PhysicalVoxel.schema, capacity),
        };
        for (let i = 0; i < capacity; i++) {
            denseVolume.data.set(i, PhysicalVoxel.pack(air));
        }
        const index = DenseVolume.getIndex(denseVolume, solidX, solidY, solidZ);
        denseVolume.data.set(index, PhysicalVoxel.pack(rock));
        return ColumnVolume.create(denseVolume);
    };

    it("should pick a single VolumeModel", () => {
        const db = Database.create(Database.Plugin.combine(graphics, volumeModel));
        const chunk = createTestChunk(2, 2, 1);
        db.transactions.createVolumeModel({
            position: [8, 8, 0],
            materialVolume: chunk,
        });

        // Voxel at model (2,2,1) = world (10,10,1)..(11,11,2); line through center
        const line: Line3 = { a: [10, 10, 5], b: [10, 10, 0] };
        const result = pickVolumeModels(db, line);

        expect(result).not.toBeNull();
        expect(result?.entity).toBeDefined();
        expect(result?.modelCoordinates).toEqual([2, 2, 1]);
    });

    it("should return null when line misses", () => {
        const db = Database.create(Database.Plugin.combine(graphics, volumeModel));
        const chunk = createTestChunk(2, 2, 1);
        db.transactions.createVolumeModel({
            position: [8, 8, 0],
            materialVolume: chunk,
        });

        const line: Line3 = { a: [100, 100, 10], b: [100, 100, 0] };
        const result = pickVolumeModels(db, line);

        expect(result).toBeNull();
    });

    it("should return null when no VolumeModels exist", () => {
        const db = Database.create(Database.Plugin.combine(graphics, volumeModel));
        const line: Line3 = { a: [8, 8, 10], b: [8, 8, 0] };
        const result = pickVolumeModels(db, line);
        expect(result).toBeNull();
    });
});
