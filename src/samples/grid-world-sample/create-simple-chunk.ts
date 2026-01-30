import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../../types/column-volume/column-volume.js";
import { Material } from "../../types/material/material.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/public.js";
import * as ColumnVolumeNamespace from "../../types/column-volume/public.js";

/**
 * Simple 2D fractal noise function using multiple octaves of sine waves.
 * Creates a continuous, seamless noise pattern across chunk boundaries.
 * 
 * @param x World X coordinate
 * @param y World Y coordinate
 * @param scale Noise scale (smaller = larger features)
 * @param octaves Number of noise octaves for fractal detail
 * @returns Noise value in range [0, 1]
 */
const fractalNoise = (x: number, y: number, scale: number = 0.1, octaves: number = 3): number => {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        // Combine multiple sine waves at different frequencies and angles
        const noise1 = Math.sin(x * frequency) * Math.cos(y * frequency);
        const noise2 = Math.sin(x * frequency * 1.3 + y * frequency * 0.7) * 0.5;
        const noise3 = Math.cos(x * frequency * 0.7 + y * frequency * 1.3) * 0.5;
        
        value += (noise1 + noise2 + noise3) * amplitude;
        maxValue += amplitude * 2; // Max possible value for normalization
        
        amplitude *= 0.5; // Each octave has half the amplitude
        frequency *= 2; // Each octave doubles the frequency
    }
    
    // Normalize to [0, 1] range
    return (value / maxValue + 1) * 0.5;
};

/**
 * Creates a seamless chunk with fractal noise-based elevation.
 * Chunks must be 16x16 in x/y dimensions to match blocksPerChunk.
 * 
 * The noise function is sampled at world coordinates (chunkX * chunkSize + localX, chunkY * chunkSize + localY)
 * to ensure seamless continuity across chunk boundaries.
 * 
 * @param materialId The material to use for all blocks in this chunk
 * @param chunkX The chunk's X index (logical coordinate)
 * @param chunkY The chunk's Y index (logical coordinate)
 * @returns A ColumnVolume with fractal noise elevation pattern
 */
export const createCheckerboardChunk = (
    materialId: Material.Id,
    chunkX: number,
    chunkY: number
): ColumnVolume<Material.Id> => {
    // Chunks must be 16x16 in x/y to match blocksPerChunk
    const chunkSize = 16;
    // Max height in blocks (half of 24 = 12)
    const maxHeight = 12;
    // Tower dimensions
    const towerWidth = 4;
    const towerHeight = 7; // Shorter fort structure
    const towerHollowStart = 6; // Platform extends to one block below top (just below crenelations)
    const crenelationHeight = 1; // Height of crenelations above main tower
    const size: Vec3 = [chunkSize, chunkSize, maxHeight + towerHeight + crenelationHeight];
    const capacity = size[0] * size[1] * size[2];
    const denseVolume: DenseVolume<Material.Id> = {
        type: "dense",
        size,
        data: createTypedBuffer(Material.Id.schema, capacity),
    };
    
    // Initialize all voxels to air (0)
    for (let i = 0; i < capacity; i++) {
        denseVolume.data.set(i, Material.ids.air);
    }
    
    // Create fractal noise-based elevation pattern
    // Convert chunk coordinates to world coordinates for seamless noise sampling
    const worldOffsetX = chunkX * chunkSize;
    const worldOffsetY = chunkY * chunkSize;
    
    // Store terrain heights for tower placement
    const terrainHeights: number[][] = [];
    
    for (let y = 0; y < chunkSize; y++) {
        terrainHeights[y] = [];
        for (let x = 0; x < chunkSize; x++) {
            // Sample noise at world coordinates for seamless continuity
            const worldX = worldOffsetX + x;
            const worldY = worldOffsetY + y;
            
            // Get noise value in [0, 1] range
            const noiseValue = fractalNoise(worldX, worldY, 0.15, 4);
            
            // Convert noise to elevation (1 to maxHeight blocks)
            // Use a curve to make more interesting terrain (higher values more common)
            const elevation = Math.floor(1 + noiseValue * noiseValue * (maxHeight - 1)) + 1;
            const height = Math.min(elevation, maxHeight);
            terrainHeights[y][x] = height;
            
            // Fill voxels from z=0 up to height
            for (let z = 0; z < height; z++) {
                const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, z);
                denseVolume.data.set(index, materialId);
            }
        }
    }
    
    // Place deterministic wooden towers
    // Towers are placed every 48 blocks at positions like (24, 24), (72, 24), etc.
    const towerSpacing = 48;
    const towerOffset = 24; // Center of tower spacing
    const towerHalfWidth = Math.floor(towerWidth / 2); // 2 blocks on each side of center
    
    for (let y = 0; y < chunkSize; y++) {
        for (let x = 0; x < chunkSize; x++) {
            const worldX = worldOffsetX + x;
            const worldY = worldOffsetY + y;
            
            // Find the nearest tower center
            const towerCenterX = Math.round((worldX - towerOffset) / towerSpacing) * towerSpacing + towerOffset;
            const towerCenterY = Math.round((worldY - towerOffset) / towerSpacing) * towerSpacing + towerOffset;
            
            // Check if current position is within tower footprint (4x4 centered at tower position)
            const dx = worldX - towerCenterX;
            const dy = worldY - towerCenterY;
            
            if (Math.abs(dx) <= towerHalfWidth && Math.abs(dy) <= towerHalfWidth) {
                // This position is within a tower footprint
                // Get terrain height at the tower center for consistent base
                const towerLocalX = towerCenterX - worldOffsetX;
                const towerLocalY = towerCenterY - worldOffsetY;
                
                // Use terrain height at tower center if it's within this chunk, otherwise use current position
                let baseHeight = terrainHeights[y][x];
                if (towerLocalX >= 0 && towerLocalX < chunkSize && towerLocalY >= 0 && towerLocalY < chunkSize) {
                    baseHeight = terrainHeights[towerLocalY][towerLocalX];
                }
                
                // Determine if this is an exterior wall position or interior
                const isExterior = Math.abs(dx) === towerHalfWidth || Math.abs(dy) === towerHalfWidth;
                const isCorner = Math.abs(dx) === towerHalfWidth && Math.abs(dy) === towerHalfWidth;
                const isInterior = !isExterior;
                
                // Find minimum terrain height in the 4x4 tower area for support legs
                let minTerrainHeight = baseHeight;
                for (let ty = -towerHalfWidth; ty <= towerHalfWidth; ty++) {
                    for (let tx = -towerHalfWidth; tx <= towerHalfWidth; tx++) {
                        const checkWorldX = towerCenterX + tx;
                        const checkWorldY = towerCenterY + ty;
                        const checkLocalX = checkWorldX - worldOffsetX;
                        const checkLocalY = checkWorldY - worldOffsetY;
                        
                        if (checkLocalX >= 0 && checkLocalX < chunkSize && checkLocalY >= 0 && checkLocalY < chunkSize) {
                            const terrainH = terrainHeights[checkLocalY][checkLocalX];
                            minTerrainHeight = Math.min(minTerrainHeight, terrainH);
                        }
                    }
                }
                
                // Place support legs at corners that extend down to terrain
                if (isCorner) {
                    for (let z = minTerrainHeight; z < baseHeight; z++) {
                        if (z >= 0 && z < size[2]) {
                            const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, z);
                            denseVolume.data.set(index, Material.ids.woodHard);
                        }
                    }
                }
                
                // Build tower structure
                for (let z = baseHeight; z < baseHeight + towerHeight; z++) {
                    if (z < size[2]) {
                        const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, z);
                        const relativeZ = z - baseHeight;
                        
                        // Exterior walls: alternating hard/soft wood pattern (checkerboard)
                        if (isExterior) {
                            // Create alternating pattern based on position
                            const patternX = Math.floor((worldX - towerCenterX + towerHalfWidth) / 1);
                            const patternY = Math.floor((worldY - towerCenterY + towerHalfWidth) / 1);
                            const patternZ = Math.floor(relativeZ / 1);
                            const isHardWood = (patternX + patternY + patternZ) % 2 === 0;
                            
                            denseVolume.data.set(index, isHardWood ? Material.ids.woodHard : Material.ids.woodSoft);
                        }
                        // Interior: hollow at top, solid woodSoft at bottom
                        else if (isInterior) {
                            if (relativeZ < towerHollowStart) {
                                // Solid interior at bottom (foundation/platform)
                                denseVolume.data.set(index, Material.ids.woodSoft);
                            }
                            // Top is hollow (empty/air)
                        }
                    }
                }
                
                // Add crenelations on top (alternating high/low battlements)
                if (isExterior) {
                    const topZ = baseHeight + towerHeight;
                    // Create crenelation pattern: alternating blocks are taller
                    const crenelationPattern = ((worldX - towerCenterX + towerHalfWidth) + (worldY - towerCenterY + towerHalfWidth)) % 2 === 0;
                    
                    if (crenelationPattern && topZ + crenelationHeight < size[2]) {
                        // This position gets a crenelation (merlon) - one block taller
                        const index = DenseVolumeNamespace.getIndex(denseVolume, x, y, topZ);
                        // Use same material pattern as the wall below
                        const patternX = Math.floor((worldX - towerCenterX + towerHalfWidth) / 1);
                        const patternY = Math.floor((worldY - towerCenterY + towerHalfWidth) / 1);
                        const patternZ = Math.floor(towerHeight / 1);
                        const isHardWood = (patternX + patternY + patternZ) % 2 === 0;
                        denseVolume.data.set(index, isHardWood ? Material.ids.woodHard : Material.ids.woodSoft);
                    }
                    // Other positions remain at the lower height (crenelation gap)
                }
            }
        }
    }
    
    return ColumnVolumeNamespace.create(denseVolume);
};

