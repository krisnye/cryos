import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { PositionColorNormalVertex } from "../vertices/position-color-normal.js";

/**
 * Generic system that creates GPU buffers from vertex data.
 * 
 * Runs every frame to:
 * 1. Find all entities with vertexData
 * 2. If no modelVertexBuffer OR vertexData has changed (by identity), create new GPU buffer
 * 3. Cache GPU buffers by vertexData identity to avoid duplicates
 * 4. Handle reference counting and cleanup
 * 
 * This system works with any vertex data source (voxels, particles, etc.)
 */
export const vertexBufferSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    
    // Cache GPU buffers by vertexData identity
    const bufferCache = new Map<TypedBuffer<PositionColorNormalVertex>, {
        buffer: GPUBuffer;
        refCount: number;
    }>();
    
    // Track which entities are using which vertexData (by identity)
    const entityToVertexData = new Map<number, TypedBuffer<PositionColorNormalVertex>>();
    
    return [{
        name: "vertexBufferSystem",
        phase: "update",
        run: () => {
            const device = store.resources.device;
            if (!device) return; // Skip if no GPU device available
            
            // Query all entities that have vertexData
            const tables = store.queryArchetypes(["vertexData"]);
            
            for (const table of tables) {
                const entityIds = table.columns.id.getTypedArray();
                
                for (let i = 0; i < table.rowCount; i++) {
                    const entityId = entityIds[i];
                    const vertexData = table.columns.vertexData?.get(i);
                    
                    if (!vertexData) continue;
                    
                    // Check if vertexData has changed (by object identity)
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
                        
                        // Get or create cached GPU buffer for this vertexData
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
                        store.update(entityId, {
                            modelVertexBuffer: cacheEntry.buffer,
                            modelVertexBufferSource: vertexData
                        });
                    }
                }
            }
        }
    }];
};

