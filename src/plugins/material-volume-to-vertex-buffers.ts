import { Database } from "@adobe/data/ecs";
import { TypedBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { memoize } from "@adobe/data/cache/functions/memoize";
import { volumeModel } from "./volume-model.js";
import { PositionNormalMaterialVertex } from "../types/vertices/position-normal-material/index.js";
import { Volume } from "../types/volume/volume.js";
import { MaterialId } from "../types/material/material-id.js";
import { materialVolumeToVertexData } from "./volume-model-rendering/material-volume-to-vertex-data.js";
import { checkMaterialTypes, VisibilityType } from "../types/volume-material/index.js";

/**
 * Get or generate opaque vertex data for a volume.
 * Returns undefined if volume has no opaque materials.
 * Memoized by volume identity using WeakMap.
 */
const getOpaqueVertexData = memoize((volume: Volume<MaterialId>): TypedBuffer<PositionNormalMaterialVertex> | undefined => {
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    return vertexData.capacity > 0 ? vertexData : undefined;
});

/**
 * Get or generate transparent vertex data for a volume.
 * Returns undefined if volume has no transparent materials.
 * Memoized by volume identity using WeakMap.
 */
const getTransparentVertexData = memoize((volume: Volume<MaterialId>): TypedBuffer<PositionNormalMaterialVertex> | undefined => {
    const vertexData = materialVolumeToVertexData(volume, { opaque: false });
    return vertexData.capacity > 0 ? vertexData : undefined;
});

/**
 * System that generates GPU vertex buffers from material volumes with caching.
 * Generates separate opaque and transparent buffers for volumes with visible faces.
 * Multiple entities with the same materialVolume share cached buffers.
 */
export const materialVolumeToVertexBuffers = Database.Plugin.create({
    extends: volumeModel,
    systems: {
        materialVolumeToVertexBuffers: {
            create: (db) => {
                // Cache GPU buffers by vertex data identity (in closure)
                const opaqueBufferCache = new Map<TypedBuffer<PositionNormalMaterialVertex>, GPUBuffer>();
                const transparentBufferCache = new Map<TypedBuffer<PositionNormalMaterialVertex>, GPUBuffer>();

                /**
                 * Get or create GPU buffer for vertex data.
                 */
                function getOrCreateGPUBuffer(
                    vertexData: TypedBuffer<PositionNormalMaterialVertex>,
                    cache: Map<TypedBuffer<PositionNormalMaterialVertex>, GPUBuffer>,
                    device: GPUDevice
                ): GPUBuffer {
                    let buffer = cache.get(vertexData);
                    if (!buffer) {
                        const dataArray = vertexData.getTypedArray();
                        const gpuBuffer = device.createBuffer({
                            size: dataArray.byteLength,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                            mappedAtCreation: false
                        });
                        buffer = copyToGPUBuffer(vertexData, device, gpuBuffer);
                        cache.set(vertexData, buffer);
                    }
                    return buffer;
                }

                /**
                 * Process a single entity: generate and set buffers based on volume material types.
                 */
                function processEntity(entityId: number, materialVolume: Volume<MaterialId>, device: GPUDevice): void {
                    // Check which material types the volume contains
                    const materialType = checkMaterialTypes(materialVolume);
                    
                    // Check which buffers already exist
                    const existingOpaque = db.store.get(entityId, "opaqueVertexBuffer");
                    const existingTransparent = db.store.get(entityId, "transparentVertexBuffer");
                    
                    const updates: { opaqueVertexBuffer?: GPUBuffer; transparentVertexBuffer?: GPUBuffer } = {};
                    
                    // Generate opaque buffer if volume has opaque materials and buffer is missing
                    const hasOpaque = materialType === VisibilityType.OPAQUE_ONLY || materialType === VisibilityType.BOTH;
                    if (hasOpaque && !existingOpaque) {
                        const opaqueVertexData = getOpaqueVertexData(materialVolume);
                        if (opaqueVertexData) {
                            updates.opaqueVertexBuffer = getOrCreateGPUBuffer(opaqueVertexData, opaqueBufferCache, device);
                        }
                    }
                    
                    // Generate transparent buffer if volume has transparent materials and buffer is missing
                    const hasTransparent = materialType === VisibilityType.TRANSPARENT_ONLY || materialType === VisibilityType.BOTH;
                    if (hasTransparent && !existingTransparent) {
                        const transparentVertexData = getTransparentVertexData(materialVolume);
                        if (transparentVertexData) {
                            updates.transparentVertexBuffer = getOrCreateGPUBuffer(transparentVertexData, transparentBufferCache, device);
                        }
                    }
                    
                    // Error if neither buffer was written (empty volume)
                    if (updates.opaqueVertexBuffer === undefined && updates.transparentVertexBuffer === undefined) {
                        // Check if this is because volume is empty (no materials) vs already has both buffers
                        if (!existingOpaque && !existingTransparent) {
                            throw new Error("Volume contains no visible materials (all air/empty)");
                        }
                    }
                    
                    // Update entity with any new buffers
                    if (updates.opaqueVertexBuffer !== undefined || updates.transparentVertexBuffer !== undefined) {
                        db.store.update(entityId, updates);
                    }
                }

                return () => {
                    const device = db.store.resources.device;
                    if (!device) return; // Skip if no GPU device available

                    // Query all entities with materialVolume
                    const volumeTables = db.store.queryArchetypes(["volumeModel", "materialVolume"]);

                    for (const table of volumeTables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const materialVolume = table.columns.materialVolume?.get(i) as Volume<MaterialId> | undefined;

                            if (!materialVolume) continue;

                            processEntity(entityId, materialVolume, device);
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});

