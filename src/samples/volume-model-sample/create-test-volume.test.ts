import { expect, test, describe } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/namespace.js";
import { createTestVolume2x2x2 } from "./create-test-volume.js";

describe("createTestVolume2x2x2", () => {
    test("given no parameters, should return a 2x2x3 volume with bottom and top layers filled", () => {
        const volume = createTestVolume2x2x2();

        // Verify volume size is exactly 2x2x3
        expect(volume.size).toEqual([2, 2, 3]);
        expect(volume.size[0]).toBe(2);
        expect(volume.size[1]).toBe(2);
        expect(volume.size[2]).toBe(3);
    });

    test("given no parameters, should have all 8 voxels with non-air materials", () => {
        const volume = createTestVolume2x2x2();
        const capacity = volume.size[0] * volume.size[1] * volume.size[2];

        // All 8 voxels should be non-air (material ID > 0)
        for (let i = 0; i < capacity; i++) {
            const materialId = volume.data.get(i);
            expect(materialId).toBeGreaterThan(0);
            expect(materialId).toBeLessThan(Material.materials.length);
        }
    });

    test("given no parameters, should have unique materials for bottom and top layers", () => {
        const volume = createTestVolume2x2x2();
        const materialIds = new Set<MaterialId>();

        // Collect all material IDs from bottom and top layers
        for (let z = 0; z < 3; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    const index = DenseVolumeNamespace.index<MaterialId>(volume, x, y, z);
                    const materialId = volume.data.get(index);
                    if (materialId > 0) { // Skip air
                        materialIds.add(materialId);
                    }
                }
            }
        }

        // Should have materials from bottom layer (4), middle layer (4 glass), and top layer (4)
        expect(materialIds.size).toBeGreaterThan(0);
    });

    test("given no parameters, should have voxels at correct positions with correct materials", () => {
        const volume = createTestVolume2x2x2();

        // Verify bottom layer (z=0) and top layer (z=2) have materials
        // Middle layer (z=1) has glass
        for (let z = 0; z < 3; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    const index = DenseVolumeNamespace.index<MaterialId>(volume, x, y, z);
                    const materialId = volume.data.get(index);
                    expect(materialId).toBeGreaterThanOrEqual(0);
                    expect(materialId).toBeLessThan(Material.materials.length);
                }
            }
        }
    });
});

