import { describe, expect, test } from "vitest";
import { modelsToVolume } from "./models-to-volume.js";
import { createVoxelEditorStore } from "../voxel-editor-store.js";
import { Quat } from "@adobe/data/math";
import { materials } from "physics/basic-materials.js";
import { Volume } from "data/index.js";

describe("modelsToVolume", () => {
    test("single voxel at origin", () => {
        const store = createVoxelEditorStore();
        
        // Create a single model entity at position [0, 0, 0]
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: [1, 0, 0, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });

        const volume = modelsToVolume(store);

        expect(volume.material.size).toEqual([1, 1, 1]);
        expect(volume.material.data.get(0)).toBe(materials.rock.index);
    });

    test("multiple scattered voxels", () => {
        const store = createVoxelEditorStore();
        
        // Create voxels at different positions
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [2, 3, 4],
            color: [1, 0, 0, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.dirt.index,
            position: [5, 7, 9],
            color: [0.5, 0.3, 0.1, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });

        const volume = modelsToVolume(store);

        // Bounding box should be from [2,3,4] to [5,7,9] inclusive
        // Size = [4, 5, 6] (5-2+1, 7-3+1, 9-4+1)
        expect(volume.material.size).toEqual([4, 5, 6]);
        
        // Check rock at relative position [0, 0, 0]
        const rockIndex = Volume.index(volume.material, 0, 0, 0);
        expect(volume.material.data.get(rockIndex)).toBe(materials.rock.index);
        
        // Check dirt at relative position [3, 4, 5]
        const dirtIndex = Volume.index(volume.material, 3, 4, 5);
        expect(volume.material.data.get(dirtIndex)).toBe(materials.dirt.index);
    });

    test("empty positions filled with air", () => {
        const store = createVoxelEditorStore();
        
        // Create two voxels with gap between them
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: [1, 0, 0, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [2, 0, 0],
            color: [1, 0, 0, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });

        const volume = modelsToVolume(store);

        // Size should be [3, 1, 1] to include the gap
        expect(volume.material.size).toEqual([3, 1, 1]);
        
        // Middle position should be air (0)
        const middleIndex = Volume.index(volume.material, 1, 0, 0);
        expect(volume.material.data.get(middleIndex)).toBe(materials.air.index);
    });

    test("empty store produces minimal volume", () => {
        const store = createVoxelEditorStore();

        const volume = modelsToVolume(store);

        // Should return a 1x1x1 volume filled with air
        expect(volume.material.size).toEqual([1, 1, 1]);
        expect(volume.material.data.get(0)).toBe(materials.air.index);
    });

    test("correct volume index calculation", () => {
        const store = createVoxelEditorStore();
        
        // Create a voxel at specific position
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.water.index,
            position: [1, 2, 3],
            color: [0, 0, 1, 1],
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });

        const volume = modelsToVolume(store);

        // Volume starts at [1,2,3], so size is [1,1,1]
        expect(volume.material.size).toEqual([1, 1, 1]);
        
        // Single voxel should be at index 0
        const index = Volume.index(volume.material, 0, 0, 0);
        expect(index).toBe(0);
        expect(volume.material.data.get(index)).toBe(materials.water.index);
    });
});

