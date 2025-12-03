import { describe, expect, test, vi, beforeEach } from "vitest";
import { loadModel } from "./load-model.js";
import { createVoxelEditorStore } from "../voxel-editor-store.js";
import { Quat } from "@adobe/data/math";
import { materials } from "physics/basic-materials.js";
import { serializeVoxelModel } from "../functions/serialize-voxel-model.js";
import { modelsToVolume } from "../functions/models-to-volume.js";

describe("loadModel", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test("loads and reconstructs Model entities from file", async () => {
        const store = createVoxelEditorStore();
        
        // Create test data to serialize
        const sourceStore = createVoxelEditorStore();
        sourceStore.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [5, 10, 15],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const volume = modelsToVolume(sourceStore);
        const jsonString = await serializeVoxelModel(volume);
        
        // Mock file system
        const mockFile = {
            text: vi.fn().mockResolvedValue(jsonString),
        };
        const mockHandle = {
            getFile: vi.fn().mockResolvedValue(mockFile),
        };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
        
        await loadModel(store);
        
        // Verify Model entity was created
        let modelCount = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            modelCount += table.rowCount;
        }
        expect(modelCount).toBe(1);
    });

    test("clears existing Model entities before loading", async () => {
        const store = createVoxelEditorStore();
        
        // Add existing models
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.dirt.index,
            position: [0, 0, 0],
            color: materials.dirt.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        // Create new test data
        const sourceStore = createVoxelEditorStore();
        sourceStore.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [1, 1, 1],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const volume = modelsToVolume(sourceStore);
        const jsonString = await serializeVoxelModel(volume);
        
        const mockFile = { text: vi.fn().mockResolvedValue(jsonString) };
        const mockHandle = { getFile: vi.fn().mockResolvedValue(mockFile) };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
        
        await loadModel(store);
        
        // Should only have the loaded model, not the old one
        let hasRock = false;
        let hasDirt = false;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            for (let i = 0; i < table.rowCount; i++) {
                const material = table.columns.material.get(i);
                if (material === materials.rock.index) hasRock = true;
                if (material === materials.dirt.index) hasDirt = true;
            }
        }
        expect(hasRock).toBe(true);
        expect(hasDirt).toBe(false);
    });

    test("updates modelSize resource", async () => {
        const store = createVoxelEditorStore();
        store.resources.modelSize = [16, 16, 16];
        
        const sourceStore = createVoxelEditorStore();
        // Set workspace size to a larger volume
        sourceStore.resources.modelSize = [50, 60, 70];
        
        // Create models spanning the workspace
        sourceStore.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        sourceStore.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.dirt.index,
            position: [49, 59, 69],
            color: materials.dirt.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const model = modelsToVolume(sourceStore);
        const jsonString = await serializeVoxelModel(model);
        
        const mockFile = { text: vi.fn().mockResolvedValue(jsonString) };
        const mockHandle = { getFile: vi.fn().mockResolvedValue(mockFile) };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
        
        await loadModel(store);
        
        expect(store.resources.modelSize).toEqual([50, 60, 70]);
    });

    test("returns file handle on success", async () => {
        const store = createVoxelEditorStore();
        
        const sourceStore = createVoxelEditorStore();
        const model = modelsToVolume(sourceStore);
        const jsonString = await serializeVoxelModel(model);
        
        const mockFile = { text: vi.fn().mockResolvedValue(jsonString) };
        const mockHandle = { getFile: vi.fn().mockResolvedValue(mockFile) };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
        
        const result = await loadModel(store);
        
        expect(result).toBe(mockHandle);
    });

    test("returns null when user cancels", async () => {
        const store = createVoxelEditorStore();
        
        window.showOpenFilePicker = vi.fn().mockResolvedValue(null);
        
        const result = await loadModel(store);
        
        expect(result).toBeNull();
    });

    test("preserves existing model on load failure", async () => {
        const store = createVoxelEditorStore();
        
        // Add existing model
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [5, 5, 5],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        // Mock file with invalid JSON
        const mockFile = { text: vi.fn().mockResolvedValue("{ invalid json }") };
        const mockHandle = { getFile: vi.fn().mockResolvedValue(mockFile) };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
        
        await expect(loadModel(store)).rejects.toThrow();
        
        // Original model should still exist
        let modelCount = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            modelCount += table.rowCount;
        }
        expect(modelCount).toBe(1);
    });
});

