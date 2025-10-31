import { SystemFactory } from "systems/system-factory.js";
import { rgbaVolumeToVertexData } from "../functions/rgba-volume-to-vertex-data.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { Rgba, Volume } from "data/index.js";

/**
 * System that converts voxelColor volumes to vertex data (CPU-side only).
 * 
 * Runs every frame to:
 * 1. Check all VoxelModels
 * 2. If voxelColor exists and has changed, regenerate vertexData
 * 3. Store vertexData as a component for the GPU buffer system to use
 * 
 * Caches computed vertex data by voxelColor identity to avoid recomputation.
 */
export const voxelVertexDataSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    
    // Cache computed vertex data by voxelColor identity
    // Multiple entities can share the same voxelColor and thus the same vertexData
    const vertexDataCache = new Map<Volume<Rgba>, ReturnType<typeof rgbaVolumeToVertexData>>();
    
    return [{
        name: "voxelVertexDataSystem",
        phase: "update",
        run: () => {
            const voxelTables = store.queryArchetypes(store.archetypes.VoxelModel.components);
            
            for (const table of voxelTables) {
                const entityIds = table.columns.id.getTypedArray();
                
                for (let i = 0; i < table.rowCount; i++) {
                    const entityId = entityIds[i];
                    const voxelColor = table.columns.voxelColor.get(i);
                    const currentVertexSource = table.columns.voxelVertexSource?.get(i);
                    
                    if (!voxelColor) continue;
                    
                    // Check if we need to regenerate vertex data (object identity changed)
                    if (currentVertexSource !== voxelColor) {
                        // Get or compute vertex data (cached by voxelColor identity)
                        let vertexData = vertexDataCache.get(voxelColor);
                        
                        if (!vertexData) {
                            // Convert voxel volume to vertex data (CPU-side operation)
                            vertexData = rgbaVolumeToVertexData(voxelColor);
                            vertexDataCache.set(voxelColor, vertexData);
                        }
                        
                        // Store both the vertex data and track the source
                        store.update(entityId, {
                            vertexData,
                            voxelVertexSource: voxelColor
                        });
                    }
                }
            }
        }
    }];
};

