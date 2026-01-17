import { Database } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { volumeModelRenderingData } from "./volume-model-rendering-data.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";

/**
 * System that generates vertex data from material volumes with caching.
 * Multiple entities with the same materialVolume share cached vertex data.
 */
export const generateVolumeModelVertexData = Database.Plugin.create({
    extends: volumeModelRenderingData,
    systems: {
        generateVolumeModelVertexData: {
            create: (db) => {
                // Cache computed vertex data by materialVolume identity (in closure)
                // Multiple entities can share the same materialVolume and thus the same volumeModelVertexData
                const vertexDataCache = new Map<Volume<MaterialId>, TypedBuffer<PositionNormalMaterialVertex>>();

                return () => {
                    // Query entities with materialVolume component (VolumeModel archetype)
                    const volumeTables = db.store.queryArchetypes(["volumeModel", "materialVolume", "position"]);

                    for (const table of volumeTables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const materialVolume = table.columns.materialVolume?.get(i) as Volume<MaterialId> | undefined;

                            if (!materialVolume) continue;

                            // Check current vertex source using get() for single component
                            const currentVertexSource = db.store.get(entityId, "volumeModelVertexSource") as Volume<MaterialId> | undefined;

                            // Check if we need to regenerate vertex data (object identity changed)
                            if (currentVertexSource !== materialVolume) {
                                // Get or compute vertex data (cached by materialVolume identity)
                                let vertexData = vertexDataCache.get(materialVolume);

                                if (!vertexData) {
                                    // Convert volume to vertex data (CPU-side operation)
                                    // Render in model space: 0,0,0 at corner of 0th index, bounds at size
                                    // Generate opaque faces only (treat transparent voxels as empty)
                                    vertexData = materialVolumeToVertexData(materialVolume, { opaqueOnly: true });
                                    vertexDataCache.set(materialVolume, vertexData);
                                }

                                // Only add vertex data component if volume has visible faces (capacity > 0)
                                // Don't add rendering components for empty volumes
                                if (vertexData.capacity > 0) {
                                    // Store both the vertex data and track the source
                                    db.store.update(entityId, {
                                        volumeModelVertexData: vertexData,
                                        volumeModelVertexSource: materialVolume,
                                    });
                                } else {
                                    // Volume has no visible faces - remove rendering components if they exist
                                    // Check if entity has volumeModelVertexData component before removing
                                    const existingVertexData = db.store.get(entityId, "volumeModelVertexData");
                                    if (existingVertexData) {
                                        db.store.update(entityId, {
                                            volumeModelVertexData: null as unknown as TypedBuffer<PositionNormalMaterialVertex>,
                                            volumeModelVertexSource: null as unknown as Volume<MaterialId>,
                                        });
                                    }
                                }
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});

