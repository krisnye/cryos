import { describe, expect, test } from "vitest";
import { newModel } from "./new-model.js";
import { createVoxelEditorStore } from "../voxel-editor-store.js";
import { Quat } from "@adobe/data/math";
import { materials } from "physics/basic-materials.js";


describe("newModel", () => {
    test("clears all Model entities and selection", () => {
        const store = createVoxelEditorStore();
        
        // Add some model entities
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
            position: [5, 5, 5],
            color: materials.dirt.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        // Add some selected voxels
        store.archetypes.SelectedVoxel.insert({
            position: [0, 0, 0],
            selectedFaces: 0b111111, // all faces selected
        });
        
        newModel(store);
        
        // Verify all models deleted
        let modelCount = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            modelCount += table.rowCount;
        }
        expect(modelCount).toBe(0);
        
        // Verify selection cleared
        let selectionCount = 0;
        for (const entity of store.select(store.archetypes.SelectedVoxel.components)) {
            selectionCount++;
        }
        expect(selectionCount).toBe(0);
    });

    test("resets modelSize to default", () => {
        const store = createVoxelEditorStore();
        store.resources.modelSize = [50, 60, 70];
        
        newModel(store);
        
        expect(store.resources.modelSize).toEqual([16, 16, 16]);
    });

    test("works on empty store", () => {
        const store = createVoxelEditorStore();
        
        expect(() => newModel(store)).not.toThrow();
        
        let modelCount = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            modelCount += table.rowCount;
        }
        expect(modelCount).toBe(0);
    });
});

