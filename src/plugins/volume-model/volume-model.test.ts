import { expect, test, describe } from "vitest";
import { Database } from "@adobe/data/ecs";
import { volumeModel } from "./volume-model.js";
import { graphics } from "../graphics.js";
import { DenseVolumeMaterial } from "../../types/dense-volume-material/dense-volume-material.js";

describe("volumeModel transactions", () => {
    test("setVolumeModel should update materialVolume and remove buffer components", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                volumeModel
            )
        );

        const volume1 = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        const volume2 = DenseVolumeMaterial.createTestVolume({ middleLayer: "air" });

        // Create entity with initial volume
        const entityId = db.transactions.createVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume1,
        });

        // Verify initial state
        expect(db.get(entityId, "materialVolume")).toBe(volume1);

        // Call setVolumeModel transaction
        db.transactions.setVolumeModel({
            entityId,
            materialVolume: volume2,
        });

        // Verify materialVolume was updated
        expect(db.get(entityId, "materialVolume")).toBe(volume2);

        // Verify buffer components are not present (removed by transaction)
        // Note: They may be undefined or not exist at all
        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");
        
        // Both should be undefined/null (removed by transaction)
        expect(opaqueBuffer).toBeFalsy();
        expect(transparentBuffer).toBeFalsy();
    });
});

