import { Database } from "@adobe/data/ecs";
import { TypedBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { generateVolumeModelVertexData } from "./generate-vertex-data.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";

/**
 * System that creates GPU buffers from vertex data with reference counting.
 * Multiple entities with the same vertex data share GPU buffers.
 */
export const createVertexBuffers = Database.Plugin.create({
    extends: generateVolumeModelVertexData,
    systems: {
        createVertexBuffers: {
            create: (db) => {
                // Cache GPU buffers by volumeModelVertexData identity (in closure)
                const bufferCache = new Map<TypedBuffer<PositionNormalMaterialVertex>, {
                    buffer: GPUBuffer;
                    refCount: number;
                }>();

                // Track which entities are using which volumeModelVertexData (by identity)
                const entityToVertexData = new Map<number, TypedBuffer<PositionNormalMaterialVertex>>();

                return () => {
                    const device = db.store.resources.device;
                    if (!device) return; // Skip if no GPU device available

                    // Query all entities that have volumeModelVertexData
                    const tables = db.store.queryArchetypes(["volumeModelVertexData"]);

                    for (const table of tables) {
                        const entityIds = table.columns.id.getTypedArray();

                        for (let i = 0; i < table.rowCount; i++) {
                            const entityId = entityIds[i];
                            const vertexData = table.columns.volumeModelVertexData?.get(i) as TypedBuffer<PositionNormalMaterialVertex> | undefined;

                            if (!vertexData) continue;

                            // Check if volumeModelVertexData has changed (by object identity)
                            // We track this separately from the component to handle entities moving between tables
                            const oldVertexData = entityToVertexData.get(entityId);

                            if (oldVertexData !== vertexData) {
                                // Vertex data changed - update GPU buffer

                                // Release old buffer if it exists
                                if (oldVertexData !== undefined) {
                                    const oldEntry = bufferCache.get(oldVertexData);
                                    if (oldEntry) {
                                        oldEntry.refCount--;
                                        if (oldEntry.refCount === 0) {
                                            // No more references - destroy and remove from cache
                                            oldEntry.buffer.destroy();
                                            bufferCache.delete(oldVertexData);
                                        }
                                    }
                                }

                                // Get or create cached GPU buffer for this volumeModelVertexData
                                let cacheEntry = bufferCache.get(vertexData);

                                if (!cacheEntry) {
                                    // Create new GPU buffer
                                    const dataArray = vertexData.getTypedArray();
                                    const gpuBuffer = device.createBuffer({
                                        size: dataArray.byteLength,
                                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                                        mappedAtCreation: false
                                    });

                                    // Copy data to GPU
                                    const finalBuffer = copyToGPUBuffer(vertexData, device, gpuBuffer);

                                    cacheEntry = {
                                        buffer: finalBuffer,
                                        refCount: 0
                                    };

                                    bufferCache.set(vertexData, cacheEntry);
                                }

                                // Increment reference count
                                cacheEntry.refCount++;

                                // Update entity tracking
                                entityToVertexData.set(entityId, vertexData);

                                // Update entity with GPU buffer and track the source
                                db.store.update(entityId, {
                                    modelVertexBuffer: cacheEntry.buffer,
                                    modelVertexBufferSource: vertexData,
                                });
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});

