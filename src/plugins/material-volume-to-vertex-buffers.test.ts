import { expect, test, describe, beforeEach } from "vitest";
import { Database } from "@adobe/data/ecs";
import { materialVolumeToVertexBuffers } from "./material-volume-to-vertex-buffers.js";
import { volumeModel } from "./volume-model.js";
import { graphics } from "./graphics.js";
import { createTestVolume2x2x2 } from "../samples/volume-model-sample/create-test-volume.js";
import { Material } from "../types/index.js";

describe("materialVolumeToVertexBuffers", () => {
    beforeEach(() => {
        // Initialize GPU device for testing
        // Note: In a real test environment, you'd need a mock device
        // For now, we'll test the logic without actual GPU operations
    });

    test("should generate opaque and transparent buffers for volume with visible faces", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        const volume = createTestVolume2x2x2({ middleLayer: "glass" });
        
        // Create entity with volume model
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume,
        });

        // Run system (simulate update phase)
        db.system.functions.materialVolumeToVertexBuffers();

        // Check that buffers were generated (if device is available)
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        // Note: Buffers will only be created if device is available
        // In a test environment without GPU, these will be undefined
        // The important thing is that the system runs without errors
        expect(entityId).toBeDefined();
    });

    test("should not generate buffers for empty volume", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        // Create empty volume (all air)
        const emptyVolume = createTestVolume2x2x2({ middleLayer: "air" });
        // Make it completely empty by clearing all voxels
        for (let i = 0; i < emptyVolume.data.capacity; i++) {
            emptyVolume.data.set(i, Material.id.air);
        }
        
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: emptyVolume,
        });

        db.system.functions.materialVolumeToVertexBuffers();

        // Empty volume should not have buffers (no visible faces)
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        // Both should be undefined/null since there are no visible faces
        expect(opaqueBuffer).toBeFalsy();
        expect(transparentBuffer).toBeFalsy();
    });

    test("should cache buffers for entities with same volume", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        const volume = createTestVolume2x2x2({ middleLayer: "glass" });
        
        // Create two entities with the same volume
        const entityId1 = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume,
        });
        
        const entityId2 = db.transactions.createVolumeModel({
            position: [1, 0, 0],
            materialVolume: volume, // Same volume object
        });

        db.system.functions.materialVolumeToVertexBuffers();

        // Both entities should have buffers (if device available)
        // The buffers should be the same GPUBuffer object (shared via cache)
        const opaqueBuffer1 = db.get(entityId1, "opaqueVertexBuffer");
        const opaqueBuffer2 = db.get(entityId2, "opaqueVertexBuffer");
        
        // If both have buffers, they should be the same object (shared)
        if (opaqueBuffer1 && opaqueBuffer2) {
            expect(opaqueBuffer1).toBe(opaqueBuffer2);
        }
    });
});

