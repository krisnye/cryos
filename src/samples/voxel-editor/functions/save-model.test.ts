import { describe, expect, test, vi, beforeEach } from "vitest";
import { saveModel } from "./save-model.js";
import { VoxelEditorStore, createVoxelEditorStore, schema } from "../voxel-editor-store.js";
import { Store } from "@adobe/data/ecs";
import { Quat } from "@adobe/data/math";
import { materials } from "physics/basic-materials.js";

describe("saveModel", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test("converts Model entities to Volume and serializes", async () => {
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
        
        // Mock file system
        const mockWritable = {
            write: vi.fn(),
            close: vi.fn(),
        };
        const mockHandle = {
            createWritable: vi.fn().mockResolvedValue(mockWritable),
        };
        window.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);
        
        await saveModel(store);
        
        // Verify file was written
        expect(mockWritable.write).toHaveBeenCalled();
        const writtenContent = mockWritable.write.mock.calls[0][0];
        expect(typeof writtenContent).toBe("string");
        
        // Verify it's valid JSON with expected structure
        const parsed = JSON.parse(writtenContent);
        expect(parsed.json).toBeDefined();
        expect(parsed.binary).toBeDefined();
    });

    test("uses existing file handle when provided", async () => {
        const store = createVoxelEditorStore();
        
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const mockWritable = {
            write: vi.fn(),
            close: vi.fn(),
        };
        const mockHandle = {
            createWritable: vi.fn().mockResolvedValue(mockWritable),
        };
        
        const mockShowSaveFilePicker = vi.fn();
        window.showSaveFilePicker = mockShowSaveFilePicker;
        
        await saveModel(store, mockHandle as any);
        
        // Should NOT prompt for file location
        expect(mockShowSaveFilePicker).not.toHaveBeenCalled();
        // Should use provided handle
        expect(mockHandle.createWritable).toHaveBeenCalled();
    });

    test("returns file handle on success", async () => {
        const store = createVoxelEditorStore();
        
        store.archetypes.Model.insert({
            model: true,
            pickable: true,
            material: materials.rock.index,
            position: [0, 0, 0],
            color: materials.rock.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const mockWritable = {
            write: vi.fn(),
            close: vi.fn(),
        };
        const mockHandle = {
            createWritable: vi.fn().mockResolvedValue(mockWritable),
        };
        window.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);
        
        const result = await saveModel(store);
        
        expect(result).toBe(mockHandle);
    });

    test("returns null when user cancels", async () => {
        const store = createVoxelEditorStore();
        
        window.showSaveFilePicker = vi.fn().mockResolvedValue(null);
        
        const result = await saveModel(store);
        
        expect(result).toBeNull();
    });

    test("serializes volume with correct size based on voxel positions", async () => {
        const store = createVoxelEditorStore();
        
        // Add models spanning from [0,0,0] to [5,10,15]
        // This will create a volume with size [6, 11, 16] (tight bounding box)
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
            position: [5, 10, 15],
            color: materials.dirt.color,
            scale: [1, 1, 1],
            rotation: Quat.identity,
        });
        
        const mockWritable = {
            write: vi.fn(),
            close: vi.fn(),
        };
        const mockHandle = {
            createWritable: vi.fn().mockResolvedValue(mockWritable),
        };
        window.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);
        
        await saveModel(store);
        
        const writtenContent = mockWritable.write.mock.calls[0][0];
        const parsed = JSON.parse(writtenContent);
        
        // Material volume size should be the tight bounding box
        expect(parsed.json.material.size).toEqual([6, 11, 16]);
    });
});

