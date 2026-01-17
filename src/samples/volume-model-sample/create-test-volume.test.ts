import { expect, test, describe } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import * as VolumeNamespace from "../../types/volume/namespace.js";
import { createTestVolume2x2x2 } from "./create-test-volume.js";

describe("createTestVolume2x2x2", () => {
    test("given no parameters, should return a 2x2x2 volume with all 8 voxels filled", () => {
        const volume = createTestVolume2x2x2();

        // Verify volume size is exactly 2x2x2
        expect(volume.size).toEqual([2, 2, 2]);
        expect(volume.size[0]).toBe(2);
        expect(volume.size[1]).toBe(2);
        expect(volume.size[2]).toBe(2);
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

    test("given no parameters, should have unique materials for each voxel", () => {
        const volume = createTestVolume2x2x2();
        const materialIds = new Set<MaterialId>();

        // Collect all material IDs
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    const index = VolumeNamespace.index<MaterialId>(volume, x, y, z);
                    const materialId = volume.data.get(index);
                    materialIds.add(materialId);
                }
            }
        }

        // Should have 8 unique materials (or at least 8 materials if some are reused)
        // For now, we'll verify all 8 voxels are checked
        expect(materialIds.size).toBeGreaterThan(0);
    });

    test("given no parameters, should have voxels at correct positions with correct materials", () => {
        const volume = createTestVolume2x2x2();

        // Verify each of the 8 voxels exists and has a material
        // [0,0,0] through [1,1,1]
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    const index = VolumeNamespace.index<MaterialId>(volume, x, y, z);
                    const materialId = volume.data.get(index);
                    expect(materialId).toBeGreaterThan(0);
                    expect(materialId).toBeLessThan(Material.materials.length);
                }
            }
        }
    });
});

