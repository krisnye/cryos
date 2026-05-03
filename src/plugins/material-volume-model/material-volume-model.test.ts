import { expect, test, describe } from "vitest";
import { Database } from "@adobe/data/ecs";
import { materialVolumeModel } from "./material-volume-model.js";
import { graphics } from "../graphics.js";
import { DenseVolumeMaterial } from "../../types/dense-volume-material/dense-volume-material.js";

describe("materialVolumeModel transactions", () => {
    test("setMaterialVolumeModel should update materialVolume and remove buffer components", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                materialVolumeModel
            )
        );

        const volume1 = DenseVolumeMaterial.createTestVolume({ middleLayer: "glass" });
        const volume2 = DenseVolumeMaterial.createTestVolume({ middleLayer: "air" });

        const entityId = db.transactions.createMaterialVolumeModel({
            position: [0, 0, 0],
            materialVolume: volume1,
        });

        expect(db.get(entityId, "materialVolume")).toBe(volume1);

        db.transactions.setMaterialVolumeModel({
            entityId,
            materialVolume: volume2,
        });

        expect(db.get(entityId, "materialVolume")).toBe(volume2);

        const opaqueBuffer = db.get(entityId, "opaqueVertexBuffer");
        const transparentBuffer = db.get(entityId, "transparentVertexBuffer");

        expect(opaqueBuffer).toBeFalsy();
        expect(transparentBuffer).toBeFalsy();
    });
});
