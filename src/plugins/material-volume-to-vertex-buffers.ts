import { Database } from "@adobe/data/ecs";
import { copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { memoize } from "@adobe/data/cache/functions/memoize";
import { volumeModel } from "./volume-model.js";
import { Volume } from "../types/volume.js";
import { DenseVolume } from "../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../types/column-volume/column-volume.js";
import { Material } from "../types/index.js";
import { materialVolumeToVertexData } from "./volume-model-rendering/material-volume-to-vertex-data.js";

/**
 * System that generates GPU vertex buffers from material volumes.
 * Generates separate opaque and transparent buffers for volumes with visible faces.
 * Supports both DenseVolume and ColumnVolume types, converting ColumnVolume to DenseVolume on-the-fly for rendering.
 */
export const materialVolumeToVertexBuffers = Database.Plugin.create({
    extends: volumeModel,
    systems: {
        materialVolumeToVertexBuffers: {
            create: (db) => {
                /**
                 * Get or generate opaque GPU buffer for a volume.
                 * Returns undefined if volume has no opaque materials.
                 * Memoized by volume identity using WeakMap.
                 * For ColumnVolume, converts to DenseVolume temporarily (not cached).
                 */
                const getOpaqueGPUBuffer = memoize((volume: Volume<Material.Id>): GPUBuffer | undefined => {
                    const device = db.store.resources.device;
                    if (!device) throw new Error();
                    
                    // Convert ColumnVolume to DenseVolume if needed (temporary, not cached)
                    const denseVolume = DenseVolume.is(volume) 
                        ? volume 
                        : ColumnVolume.toDenseVolume(volume);
                    
                    const vertexData = materialVolumeToVertexData(denseVolume, { opaque: true });
                    if (vertexData.capacity === 0) return undefined;
                    
                    const dataArray = vertexData.getTypedArray();
                    const gpuBuffer = device.createBuffer({
                        size: dataArray.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        mappedAtCreation: false
                    });
                    const result = copyToGPUBuffer(vertexData, device, gpuBuffer);
                    return result;
                    // denseVolume will be garbage collected if it was converted
                });

                /**
                 * Get or generate transparent GPU buffer for a volume.
                 * Returns undefined if volume has no transparent materials.
                 * Memoized by volume identity using WeakMap.
                 * For ColumnVolume, converts to DenseVolume temporarily (not cached).
                 */
                const getTransparentGPUBuffer = memoize((volume: Volume<Material.Id>): GPUBuffer | undefined => {
                    const device = db.store.resources.device;
                    if (!device) throw new Error();
                    
                    // Convert ColumnVolume to DenseVolume if needed (temporary, not cached)
                    const denseVolume = DenseVolume.is(volume) 
                        ? volume 
                        : ColumnVolume.toDenseVolume(volume);
                    
                    const vertexData = materialVolumeToVertexData(denseVolume, { opaque: false });
                    if (vertexData.capacity === 0) return undefined;
                    
                    const dataArray = vertexData.getTypedArray();
                    const gpuBuffer = device.createBuffer({
                        size: dataArray.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        mappedAtCreation: false
                    });
                    const result = copyToGPUBuffer(vertexData, device, gpuBuffer);
                    return result;
                    // denseVolume will be garbage collected if it was converted
                });

                /**
                 * Process a single entity: generate and set buffers based on volume material types.
                 * Note: This is only called for entities that don't have both buffers (excluded from query).
                 */
                function processEntity(entityId: number, materialVolume: Volume<Material.Id>): void {
                    const opaqueVertexBuffer = getOpaqueGPUBuffer(materialVolume);
                    const transparentVertexBuffer = getTransparentGPUBuffer(materialVolume);
                    
                    // Error if neither buffer exists (empty volume)
                    if (!opaqueVertexBuffer && !transparentVertexBuffer) {
                        throw new Error("Volume contains no visible materials (all air/empty)");
                    }
                    
                    // Update entity with any buffers that exist
                    db.store.update(entityId, { opaqueVertexBuffer, transparentVertexBuffer });
                }

                return () => {
                    const device = db.store.resources.device;
                    if (!device) return; // Skip if no GPU device available

                    // Query entities with materialVolume that are missing at least one buffer
                    // We query for entities without both buffers, then check individually which ones are missing
                    const volumeTables = db.store.queryArchetypes(
                        ["volumeModel", "materialVolume"],
                        { exclude: ["opaqueVertexBuffer", "transparentVertexBuffer"] }
                    );

                    for (const table of volumeTables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = table.rowCount -1; i >= 0; i--) {
                            const entityId = entityIds[i];
                            const materialVolume = table.columns.materialVolume.get(i);
                            processEntity(entityId, materialVolume);
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});

