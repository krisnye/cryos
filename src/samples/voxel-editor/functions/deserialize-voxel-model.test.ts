import { describe, expect, test } from "vitest";
import { deserializeVoxelModel } from "./deserialize-voxel-model.js";
import { serializeVoxelModel } from "./serialize-voxel-model.js";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { materials } from "physics/basic-materials.js";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";

describe("deserializeVoxelModel", () => {
    test("round-trip serialization preserves data", async () => {
        // Create original model
        const data = createTypedBuffer(MaterialIndex.schema, 8);
        data.set(0, materials.rock.index);
        data.set(1, materials.water.index);
        data.set(7, materials.dirt.index);
        const originalModel = {
            modelSize: [16, 16, 16] as const,
            material: { size: [2, 2, 2] as const, data },
            offset: [3, 4, 5] as const
        };
        
        // Serialize then deserialize
        const jsonString = await serializeVoxelModel(originalModel);
        const result = await deserializeVoxelModel(jsonString);
        
        // Verify modelSize
        expect(result.modelSize).toEqual([16, 16, 16]);
        
        // Verify material volume size
        expect(result.material.size).toEqual([2, 2, 2]);
        
        // Verify offset
        expect(result.offset).toEqual([3, 4, 5]);
        
        // Verify data
        expect(result.material.data.get(0)).toBe(materials.rock.index);
        expect(result.material.data.get(1)).toBe(materials.water.index);
        expect(result.material.data.get(7)).toBe(materials.dirt.index);
    });

    test("preserves all fields correctly", async () => {
        const data = createTypedBuffer(MaterialIndex.schema, 750);
        const model = {
            modelSize: [32, 32, 32] as const,
            material: { size: [5, 10, 15] as const, data },
            offset: [10, 11, 12] as const
        };
        
        const jsonString = await serializeVoxelModel(model);
        const result = await deserializeVoxelModel(jsonString);
        
        expect(result.modelSize).toEqual([32, 32, 32]);
        expect(result.material.size).toEqual([5, 10, 15]);
        expect(result.offset).toEqual([10, 11, 12]);
    });

    test("handles corrupted JSON gracefully", async () => {
        const invalidJson = "{ this is not valid json }";
        
        await expect(() => deserializeVoxelModel(invalidJson)).rejects.toThrow();
    });
});

