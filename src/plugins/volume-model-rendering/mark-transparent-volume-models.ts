import { Database } from "@adobe/data/ecs";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { transparent } from "../transparent.js";
import { volumeModelRenderingData } from "./volume-model-rendering-data.js";
import { checkMaterialTypes, VisibilityType } from "../../types/volume-material/index.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";

/**
 * System that marks volume model entities with transparent: true when they
 * have both (1) visible faces (volumeModelVertexData with capacity > 0) and
 * (2) at least one voxel with a transparent material.
 *
 * Only adds the transparent component when both conditions hold.
 * Depends on generateVolumeModelVertexData running earlier in update (from
 * renderVolumeModels' plugin chain).
 */
export const markTransparentVolumeModels = Database.Plugin.create({
    extends: Database.Plugin.combine(volumeModelRenderingData, transparent),
    systems: {
        markTransparentVolumeModels: {
            create: (db) => {
                return () => {
                    const tables = db.store.queryArchetypes(["volumeModel", "materialVolume"]);

                    for (const table of tables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const materialVolume = db.store.get(entityId, "materialVolume");

                            if (!materialVolume) continue;

                            const vertexData = db.store.get(
                                entityId,
                                "volumeModelVertexData"
                            ) as TypedBuffer<PositionNormalMaterialVertex> | undefined;

                            if (!vertexData || vertexData.capacity === 0) continue;

                            const t = checkMaterialTypes(materialVolume);
                            if (t === VisibilityType.TRANSPARENT_ONLY || t === VisibilityType.BOTH) {
                                db.store.update(entityId, { transparent: true });
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});

