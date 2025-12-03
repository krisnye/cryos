import { describe, expect, test } from "vitest";
import { clearModel } from "./clear-model.js";
import { createVoxelEditorStore } from "../voxel-editor-store.js";
import { Quat } from "@adobe/data/math";
import { materials } from "physics/basic-materials.js";

describe("clearModel", () => {
    test("deletes all Model entities", () => {
        const store = createVoxelEditorStore();
        
        // Add some models
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.dirt.index,
            position: [1, 1, 1],
            color: materials.dirt.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        clearModel(store);
        
        // Count remaining models
        let modelCount = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            modelCount += table.rowCount;
        }
        expect(modelCount).toBe(0);
    });

    test("works on empty store", () => {
        const store = createVoxelEditorStore();
        
        expect(() => clearModel(store)).not.toThrow();
    });
});

