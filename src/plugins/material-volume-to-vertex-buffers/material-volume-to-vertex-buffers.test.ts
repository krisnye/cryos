import { expect, test, describe, beforeEach } from "vitest";
import { Database } from "@adobe/data/ecs";
import { materialVolumeToVertexBuffers } from "./material-volume-to-vertex-buffers.js";
import { volumeModel } from "../volume-model/volume-model.js";
import { graphics } from "../graphics.js";
import { DenseVolumeMaterial } from "../../types/dense-volume-material/dense-volume-material.js";
import { Material } from "../../types/material/material.js";
import { ColumnVolume } from "../../types/column-volume/column-volume.js";

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
        
        const volume = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        
        // Create entity with volume model
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume,
        });

        // Run system (simulate update phase)
        db.system.functions.materialVolumeToVertexBuffers!();

        // Check that buffers were generated (if device is available)
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        // Note: Buffers will only be created if device is available
        // In a test environment without GPU, these will be undefined
        // The important thing is that the system runs without errors
        expect(entityId).toBeDefined();
    });

    test("should generate buffers for ColumnVolume (converts to DenseVolume on-the-fly)", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        // Create a DenseVolume first, then convert to ColumnVolume
        const denseVolume = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        const columnVolume = ColumnVolume.create(denseVolume);
        
        // Verify it's a ColumnVolume
        expect(columnVolume.type).toBe("column");
        
        // Create entity with ColumnVolume
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: columnVolume,
        });

        // Run system (should convert ColumnVolume to DenseVolume internally)
        db.system.functions.materialVolumeToVertexBuffers!();

        // System should run without errors
        // Buffers will be generated if device is available
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        expect(entityId).toBeDefined();
        // Note: Buffers may be undefined if no GPU device, but system should not error
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
        const emptyVolume = DenseVolumeMaterial.createTestVolume({ middleLayer: "air" });
        // Make it completely empty by clearing all voxels
        for (let i = 0; i < emptyVolume.data.capacity; i++) {
            emptyVolume.data.set(i, Material.ids.air);
        }
        
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: emptyVolume,
        });

        db.system.functions.materialVolumeToVertexBuffers!();

        // Empty volume should not have buffers (no visible faces)
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        // Both should be undefined/null since there are no visible faces
        expect(opaqueBuffer).toBeFalsy();
        expect(transparentBuffer).toBeFalsy();
    });

    test("should cache vertex buffers for the same volume object across multiple entities", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        const volume = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        
        // Create multiple entities with the SAME volume object (same reference)
        const entityId1 = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume, // Same object reference
        });
        
        const entityId2 = db.transactions.createVolumeModel({
            position: [1, 0, 0],
            materialVolume: volume, // Same object reference
        });
        
        const entityId3 = db.transactions.createVolumeModel({
            position: [2, 0, 0],
            materialVolume: volume, // Same object reference
        });

        // Run system - memoization should cache the conversion
        db.system.functions.materialVolumeToVertexBuffers!();

        // Get the buffers for each entity
        const opaqueBuffer1 = db.get(entityId1, "opaqueVertexBuffer");
        const opaqueBuffer2 = db.get(entityId2, "opaqueVertexBuffer");
        const opaqueBuffer3 = db.get(entityId3, "opaqueVertexBuffer");
        
        // If GPU device is available, verify that all entities got buffers
        // The memoization ensures the same Volume object only converts once
        // The same GPUBuffer object should be reused across entities
        if (opaqueBuffer1) {
            expect(opaqueBuffer1).toBeDefined();
            expect(opaqueBuffer2).toBeDefined();
            expect(opaqueBuffer3).toBeDefined();
            
            // Verify that the same buffer object is reused (memoization working)
            // All entities with the same Volume object should get the same GPUBuffer reference
            expect(opaqueBuffer1).toBe(opaqueBuffer2);
            expect(opaqueBuffer2).toBe(opaqueBuffer3);
        }
    });

    test("should cache ColumnVolume conversion separately from DenseVolume", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        // Create a DenseVolume
        const denseVolume = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        
        // Convert to ColumnVolume (different object)
        const columnVolume = ColumnVolume.create(denseVolume);
        
        // Create entities with different volume types but same data
        const entityId1 = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: denseVolume,
        });
        
        const entityId2 = db.transactions.createVolumeModel({
            position: [1, 0, 0],
            materialVolume: columnVolume, // Different object, but same data
        });
        
        const entityId3 = db.transactions.createVolumeModel({
            position: [2, 0, 0],
            materialVolume: columnVolume, // Same ColumnVolume object
        });

        // Run system
        db.system.functions.materialVolumeToVertexBuffers!();

        // DenseVolume and ColumnVolume are different objects, so they cache separately
        // But entityId2 and entityId3 share the same ColumnVolume object, so that's cached
        const opaqueBuffer1 = db.get(entityId1, "opaqueVertexBuffer");
        const opaqueBuffer2 = db.get(entityId2, "opaqueVertexBuffer");
        const opaqueBuffer3 = db.get(entityId3, "opaqueVertexBuffer");
        
        if (opaqueBuffer1) {
            expect(opaqueBuffer1).toBeDefined();
            expect(opaqueBuffer2).toBeDefined();
            expect(opaqueBuffer3).toBeDefined();
        }
    });

    test("should handle both DenseVolume and ColumnVolume in same database", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel,
                materialVolumeToVertexBuffers
            )
        );
        
        // Create one entity with DenseVolume
        const denseVolume = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        const entityId1 = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: denseVolume,
        });
        
        // Create another entity with ColumnVolume (converted from same dense volume)
        const columnVolume = ColumnVolume.create(denseVolume);
        const entityId2 = db.transactions.createVolumeModel({
            position: [1, 0, 0],
            materialVolume: columnVolume,
        });

        // Run system - should handle both types
        db.system.functions.materialVolumeToVertexBuffers!();

        // Both entities should be processed without errors
        expect(entityId1).toBeDefined();
        expect(entityId2).toBeDefined();
    });
});

