import { SystemFactory } from "systems/system-factory.js";
import { rgbaVolumeToVertexData } from "../functions/rgba-volume-to-vertex-data.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { Rgba, Volume } from "data/index.js";

/**
 * System that manages voxel vertex buffers for VoxelModel entities.
 * 
 * Runs every frame to:
 * 1. Check all VoxelModels
 * 2. Validate if vertex buffer exists and is up-to-date
 * 3. Regenerate buffer if voxelColor volume has changed
 * 4. Clean up old buffers before creating new ones
 */
export const voxelVertexBufferSystem : SystemFactory<GraphicsService> = (service) => {
    // Get all VoxelModel tables - following the pattern from other systems
    const { store } = service;
    
    // Cache for shared GPUBuffers - retained across system calls
    const bufferCache = new Map<Volume<Rgba>, {
        buffer: GPUBuffer;
        refCount: number;
        source: any;
    }>();
    
    // Track which entities are using which cache entries
    const entityToCacheKey = new Map<number, any>();

    return [{
        name: "voxelVertexBufferSystem",
        phase: "update",
        run: () => {
             const voxelTables = store.queryArchetypes(store.archetypes.VoxelModel.components);
             for (const table of voxelTables) {
                 const entityIds = table.columns.id.getTypedArray();
                 for (let i = 0; i < table.rowCount; i++) {
                     const entityId = entityIds[i];
                     const voxelColor = table.columns.voxelColor.get(i);
                     
                     if (!voxelColor) continue;
                     
                     // Check if entity has changed volume (object identity)
                     const cacheKey = voxelColor;
                     const oldCacheKey = entityToCacheKey.get(entityId);
                     
                     if (oldCacheKey !== cacheKey) {
                         // Volume changed - update cache reference
                         if (oldCacheKey !== undefined) {
                             // Release old cache entry
                             const oldEntry = bufferCache.get(oldCacheKey);
                             if (oldEntry) {
                                 oldEntry.refCount--;
                                 if (oldEntry.refCount === 0) {
                                     oldEntry.buffer.destroy();
                                     bufferCache.delete(oldCacheKey);
                                 }
                             }
                         }
                         
                         // Get or create cached buffer
                         let cacheEntry = bufferCache.get(cacheKey);
                         if (!cacheEntry) {
                             const device = store.resources.device;
                             if (!device) continue; // Skip if no device
                             
                             cacheEntry = {
                                 buffer: createVertexBufferFromVolume(device, voxelColor),
                                 refCount: 0,
                                 source: voxelColor
                             };
                             bufferCache.set(cacheKey, cacheEntry);
                         }
                         
                         // Update entity assignment
                         cacheEntry.refCount++;
                         entityToCacheKey.set(entityId, cacheKey);
                         
                         store.update(entityId, { 
                             modelVertexBuffer: cacheEntry.buffer,
                             voxelVertexSource: voxelColor
                         });
                     }
                 }
             }
        }
    }]
}

/**
 * Create vertex buffer from volume (used by cache system)
 */
function createVertexBufferFromVolume(device: GPUDevice, voxelColor: any): GPUBuffer {
    // Convert voxel volume to vertex data
    const vertexData = rgbaVolumeToVertexData(voxelColor);
    
    // Create new buffer for copyToGPUBuffer to work with
    const dataArray = vertexData.getTypedArray();
    const gpuBuffer = device.createBuffer({
        size: dataArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: false
    });
    
    // Use the efficient copyToGPUBuffer utility
    const finalBuffer = copyToGPUBuffer(vertexData, device, gpuBuffer);
    
    return finalBuffer;
}
