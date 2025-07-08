import { VoxelMapChunk } from "./static-voxel-chunk.js";
import { createStaticVoxelChunk } from "./create-static-voxel-chunk.js";
import { Vec2, Vec3 } from "math/index.js";
import { perlinNoise2D } from "../../functions/perlin-noise.js";
import { updateStructureMapFromPositionArray } from "../generic-chunk/from-position-array.js";
import { StaticVoxel } from "../static-voxel/static-voxel.js";

/**
 * Creates a random static voxel chunk using Perlin noise for terrain generation.
 * 
 * @param size - The size of the chunk (size × size tiles)
 * @param position - The world position of the chunk (in chunk coordinates)
 * @returns A VoxelMapChunk with terrain generated using Perlin noise
 */
export const createRandomStaticVoxelChunk = (size: number, position: Vec2): VoxelMapChunk => {
    const chunk = createStaticVoxelChunk(size);
    const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [];
    
    // Noise parameters for terrain generation
    const noiseScale = 0.05; // Reduced scale factor for smoother, more seamless terrain
    const baseHeight = 10; // Base height for the terrain
    const heightRange = 6; // Reduced range for smaller height variations
    
    // Generate voxels for each position in the chunk
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Calculate world coordinates for seamless noise
            const worldX = position[0] * size + x;
            const worldY = position[1] * size + y;
            
            // Generate height using Perlin noise
            const noiseValue = perlinNoise2D(worldX, worldY, noiseScale);
            const height = Math.floor(baseHeight + noiseValue * heightRange);
            
            // Only create surface voxels (one per tile at the calculated height)
            if (height >= 0) {
                voxels.push({
                    position: [x, y, height],
                    type: 1, // Static voxel type
                    flags: 0,
                    damage: 0,
                    temp: 0,
                });
            }
        }
    }
    
    // Use the from-position-array function to populate the chunk
    updateStructureMapFromPositionArray(voxels, chunk);
    
    return chunk;
};
