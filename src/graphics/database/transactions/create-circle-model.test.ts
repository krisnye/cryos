import { describe, test, expect } from "vitest";
import { createCircleModel } from "./create-circle-model.js";
import { graphicsStoreSchema } from "../graphics-store.js";
import { createStoreFromSchema } from "@adobe/data/ecs";
import { index } from "data/volume/volume.js";
import { Quat } from "@adobe/data/math";

describe("createCircleModel", () => {
    test("creates circles with different radii", () => {
        const radii = [5, 10, 20];
        
        radii.forEach(radius => {
            const store = createStoreFromSchema(graphicsStoreSchema);
            const entity = createCircleModel(store, {
                position: [0, 0, 0],
                color: [1, 0, 0, 1],
                radius,
                scale: [0.25, 0.25, 0.25],
                rotation: Quat.identity()
            });
            
            expect(entity).toBeGreaterThan(0);
            
            const entityData = store.read(entity);
            expect(entityData).toBeDefined();
            
            const volume = entityData!.voxelColor;
            expect(volume.size[0]).toBe(radius * 2);
            expect(volume.size[1]).toBe(radius * 2);
            expect(volume.size[2]).toBe(1);
        });
    });

    test("fills only voxels within radius", () => {
        const store = createStoreFromSchema(graphicsStoreSchema);
        const radius = 10;
        const entity = createCircleModel(store, {
            position: [0, 0, 0],
            color: [1, 0, 0, 1],
            radius,
            scale: [1, 1, 1],
            rotation: Quat.identity()
        });
        
        const volume = store.read(entity)!.voxelColor;
        const centerX = radius;
        const centerY = radius;
        
        // Check center is filled
        const centerIdx = index(volume, centerX, centerY, 0);
        expect(volume.data.get(centerIdx)).toBeGreaterThan(0);
        
        // Check edge cases: just inside radius should be filled
        const innerX = centerX + Math.floor(radius * 0.7);
        const innerY = centerY;
        const innerIdx = index(volume, innerX, innerY, 0);
        expect(volume.data.get(innerIdx)).toBeGreaterThan(0);
        
        // Check corners (outside radius) should be empty
        const cornerIdx = index(volume, 0, 0, 0);
        expect(volume.data.get(cornerIdx)).toBe(0);
    });
});
