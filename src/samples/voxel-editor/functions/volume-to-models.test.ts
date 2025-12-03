import { describe, expect, test } from "vitest";
import { volumeToModels } from "./volume-to-models.js";
import { createVoxelEditorStore } from "../voxel-editor-store.js";
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { materials } from "physics/basic-materials.js";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";

describe("volumeToModels", () => {
    test("single non-air voxel creates one Model entity", () => {
        const store = createVoxelEditorStore();
        
        // Create a 1x1x1 volume with rock
        const data = createTypedBuffer(MaterialIndex.schema, 1);
        data.set(0, materials.rock.index);
        const volume: Volume<MaterialIndex> = { size: [1, 1, 1], data };
        const offset: Vec3 = [0, 0, 0];
        
        volumeToModels(store, volume, offset);
        
        // Should have exactly 1 Model entity
        let count = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            count += table.rowCount;
        }
        expect(count).toBe(1);
        
        // Verify the entity has correct position and material
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            const position = table.columns.position.get(0);
            const material = table.columns.material.get(0);
            expect(position).toEqual([0, 0, 0]);
            expect(material).toBe(materials.rock.index);
        }
    });

    test("air voxels are skipped", () => {
        const store = createVoxelEditorStore();
        
        // Create a 3x1x1 volume with rock-air-rock
        const data = createTypedBuffer(MaterialIndex.schema, 3);
        data.set(0, materials.rock.index);
        data.set(1, materials.air.index);
        data.set(2, materials.water.index);
        const volume: Volume<MaterialIndex> = { size: [3, 1, 1], data };
        const offset: Vec3 = [0, 0, 0];
        
        volumeToModels(store, volume, offset);
        
        // Should have exactly 2 Model entities (skip air)
        let count = 0;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            count += table.rowCount;
        }
        expect(count).toBe(2);
    });

    test("correct 3D position calculation", () => {
        const store = createVoxelEditorStore();
        
        // Create a 2x2x2 volume with a voxel at specific coordinates
        const data = createTypedBuffer(MaterialIndex.schema, 8);
        for (let i = 0; i < 8; i++) {
            data.set(i, materials.air.index);
        }
        // Set voxel at volume coordinates [1, 1, 1]
        // Index = 1 + 2 * (1 + 1 * 2) = 1 + 2 * 3 = 7
        data.set(7, materials.dirt.index);
        
        const volume: Volume<MaterialIndex> = { size: [2, 2, 2], data };
        const offset: Vec3 = [5, 10, 15];
        
        volumeToModels(store, volume, offset);
        
        // Should have 1 Model entity
        let foundPosition: Vec3 | null = null;
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            if (table.rowCount > 0) {
                foundPosition = table.columns.position.get(0);
            }
        }
        
        // World position should be offset + volume coordinates
        expect(foundPosition).toEqual([6, 11, 16]);
    });

    test("creates entities with all required Model components", () => {
        const store = createVoxelEditorStore();
        
        const data = createTypedBuffer(MaterialIndex.schema, 1);
        data.set(0, materials.rock.index);
        const volume: Volume<MaterialIndex> = { size: [1, 1, 1], data };
        const offset: Vec3 = [0, 0, 0];
        
        volumeToModels(store, volume, offset);
        
        // Verify entity has all required components
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            expect(table.rowCount).toBe(1);
            
            // Check required components exist
            expect(table.columns.model).toBeDefined();
            expect(table.columns.pickable).toBeDefined();
            expect(table.columns.material).toBeDefined();
            expect(table.columns.position).toBeDefined();
            expect(table.columns.color).toBeDefined();
            expect(table.columns.scale).toBeDefined();
            expect(table.columns.rotation).toBeDefined();
            
            // Verify material-based color is set
            const color = table.columns.color.get(0);
            expect(color).toBeDefined();
            expect(Array.isArray(color) || (color as any).length === 4).toBe(true);
        }
    });

    test("material index determines entity color", () => {
        const store = createVoxelEditorStore();
        
        const data = createTypedBuffer(MaterialIndex.schema, 2);
        data.set(0, materials.rock.index);
        data.set(1, materials.water.index);
        const volume: Volume<MaterialIndex> = { size: [2, 1, 1], data };
        const offset: Vec3 = [0, 0, 0];
        
        volumeToModels(store, volume, offset);
        
        // Collect colors
        const colors: any[] = [];
        for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
            for (let i = 0; i < table.rowCount; i++) {
                colors.push(table.columns.color.get(i));
            }
        }
        
        expect(colors.length).toBe(2);
        // Colors should match material colors (accounting for Float32 precision)
        for (let i = 0; i < 4; i++) {
            expect(colors[0][i]).toBeCloseTo(materials.rock.color[i], 5);
            expect(colors[1][i]).toBeCloseTo(materials.water.color[i], 5);
        }
    });
});

