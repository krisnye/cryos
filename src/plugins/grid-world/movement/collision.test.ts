import { describe, it, expect } from "vitest";
import { Database } from "@adobe/data/ecs";
import { Line3, Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { gridWorld } from "../grid-world.js";
import { DenseVolume } from "../../../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../../../types/column-volume/column-volume.js";
import { Material } from "../../../types/material/material.js";
import { PhysicalVoxel } from "../../../types/physical-voxel/physical-voxel.js";
import * as ColumnVolumeNamespace from "../../../types/column-volume/public.js";
import * as DenseVolumeNamespace from "../../../types/dense-volume/public.js";
import { pickWorldCollision } from "./collision.js";

describe("pickWorldCollision", () => {
    const { air, rock } = Material.ids;

    const createTestChunk = (solidX: number, solidY: number, solidZ: number, chunkSize: number = 16): ColumnVolume<PhysicalVoxel> => {
        const size: Vec3 = [chunkSize, chunkSize, solidZ + 1];
        const capacity = size[0] * size[1] * size[2];
        const denseVolume: DenseVolume<PhysicalVoxel> = {
            type: "dense",
            size,
            data: createTypedBuffer(PhysicalVoxel.schema, capacity),
        };
        for (let i = 0; i < capacity; i++) {
            denseVolume.data.set(i, PhysicalVoxel.pack(air));
        }
        const index = DenseVolumeNamespace.getIndex(denseVolume, solidX, solidY, solidZ);
        denseVolume.data.set(index, PhysicalVoxel.pack(rock));
        return ColumnVolumeNamespace.create(denseVolume);
    };

    it("given line hitting terrain, should return hit position and face normal", () => {
        const db = Database.create(gridWorld);
        const { chunkSize, blockSize } = db.resources.worldScale;
        const chunk = createTestChunk(2, 2, 1, chunkSize);
        db.transactions.createWorldChunk({ chunkX: 0, chunkY: 0, volumeModel: chunk });

        const line: Line3 = { a: [8, 8, 10], b: [8, 8, 0] };
        const result = pickWorldCollision(db, line);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("worldHitPosition");
        expect(result).toHaveProperty("faceNormal");
        expect(result!.worldHitPosition).toHaveLength(3);
        expect(result!.faceNormal).toHaveLength(3);
        expect(result!.faceNormal).toMatchObject([0, 0, 1]);
    });

    it("given line through air only, should return null", () => {
        const db = Database.create(gridWorld);
        const { chunkSize } = db.resources.worldScale;
        const emptyChunk = createTestChunk(-1, -1, -1, chunkSize);
        db.transactions.createWorldChunk({ chunkX: 0, chunkY: 0, volumeModel: emptyChunk });

        const line: Line3 = { a: [0, 0, 10], b: [0, 0, 0] };
        const result = pickWorldCollision(db, line);

        expect(result).toBeNull();
    });

    it("given line not intersecting any chunks, should return null", () => {
        const db = Database.create(gridWorld);
        const chunk = createTestChunk(2, 2, 1, 16);
        db.transactions.createWorldChunk({ chunkX: 0, chunkY: 0, volumeModel: chunk });

        const line: Line3 = { a: [1000, 1000, 10], b: [1000, 1000, 0] };
        const result = pickWorldCollision(db, line);

        expect(result).toBeNull();
    });

    it("given zero-length line, should return null", () => {
        const db = Database.create(gridWorld);
        const chunk = createTestChunk(2, 2, 1, 16);
        db.transactions.createWorldChunk({ chunkX: 0, chunkY: 0, volumeModel: chunk });

        const line: Line3 = { a: [8, 8, 5], b: [8, 8, 5] };
        const result = pickWorldCollision(db, line);

        expect(result).toBeNull();
    });

    it("given diagonal line across chunks, should return hit position and face normal", () => {
        const db = Database.create(gridWorld);
        const { chunkSize, blockSize } = db.resources.worldScale;
        for (let chunkY = 0; chunkY < 2; chunkY++) {
            for (let chunkX = 0; chunkX < 2; chunkX++) {
                const chunk = createTestChunk(8, 8, 1, chunkSize);
                db.transactions.createWorldChunk({ chunkX, chunkY, volumeModel: chunk });
            }
        }

        const line: Line3 = {
            a: [0, 0, 4],
            b: [chunkSize * blockSize * 2, chunkSize * blockSize * 2, 4],
        };
        const result = pickWorldCollision(db, line);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("worldHitPosition");
        expect(result).toHaveProperty("faceNormal");
    });
});
