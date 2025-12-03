import { describe, expect, test } from "vitest";
import { serializeVoxelModel } from "./serialize-voxel-model.js";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { materials } from "physics/basic-materials.js";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";

describe("serializeVoxelModel", () => {
    test("produces valid JSON string", async () => {
        const data = createTypedBuffer(MaterialIndex.schema, 8);
        data.set(0, materials.rock.index);
        data.set(1, materials.dirt.index);
        const model = {
            modelSize: [16, 16, 16] as const,
            material: { size: [2, 2, 2] as const, data },
            offset: [0, 0, 0] as const
        };
        
        const jsonString = await serializeVoxelModel(model);
        
        expect(typeof jsonString).toBe("string");
        // Should be parseable JSON
        expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    test("includes modelSize, material, and offset in output", async () => {
        const data = createTypedBuffer(MaterialIndex.schema, 60);
        const model = {
            modelSize: [16, 16, 16] as const,
            material: { size: [3, 4, 5] as const, data },
            offset: [1, 2, 3] as const
        };
        
        const jsonString = await serializeVoxelModel(model);
        const parsed = JSON.parse(jsonString);
        
        expect(parsed.json.modelSize).toEqual([16, 16, 16]);
        expect(parsed.json.material.size).toEqual([3, 4, 5]);
        expect(parsed.json.offset).toEqual([1, 2, 3]);
    });

    test("includes volume data in output", async () => {
        const data = createTypedBuffer(MaterialIndex.schema, 2);
        data.set(0, materials.rock.index);
        data.set(1, materials.water.index);
        const model = {
            modelSize: [16, 16, 16] as const,
            material: { size: [2, 1, 1] as const, data },
            offset: [0, 0, 0] as const
        };
        
        const jsonString = await serializeVoxelModel(model);
        const parsed = JSON.parse(jsonString);
        
        // Should have binary data
        expect(parsed.binary).toBeDefined();
        expect(typeof parsed.binary).toBe("string");
        expect(parsed.binary.length).toBeGreaterThan(0);
    });

    test("serialization format compatible with @adobe/data codec", async () => {
        const data = createTypedBuffer(MaterialIndex.schema, 4);
        data.set(0, 1);
        data.set(1, 2);
        data.set(2, 3);
        data.set(3, 4);
        const model = {
            modelSize: [16, 16, 16] as const,
            material: { size: [2, 2, 1] as const, data },
            offset: [5, 6, 7] as const
        };
        
        const jsonString = await serializeVoxelModel(model);
        const parsed = JSON.parse(jsonString);
        
        // Should have the @adobe/data serialization structure
        expect(parsed.json).toBeDefined();
        expect(parsed.lengths).toBeDefined();
        expect(parsed.binary).toBeDefined();
        expect(Array.isArray(parsed.lengths)).toBe(true);
    });
});

