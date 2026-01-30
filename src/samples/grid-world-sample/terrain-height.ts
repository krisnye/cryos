/**
 * Shared terrain height calculation utilities.
 * Used by both chunk generation and player movement.
 */

/**
 * Maximum terrain height in blocks (before scaling by blockSize).
 * This matches the maxHeight used in create-simple-chunk.ts.
 */
export const MAX_TERRAIN_HEIGHT_BLOCKS = 12;

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
export const fractalNoise = (x: number, y: number, scale: number = 0.15, octaves: number = 4): number => {
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
 * Calculate terrain height at a world position.
 * 
 * @param x World X coordinate (in world units)
 * @param y World Y coordinate (in world units)
 * @param maxHeightBlocks Maximum terrain height in blocks
 * @param blockSize Block size in world units
 * @returns Terrain height in world units
 */
export const getTerrainHeight = (x: number, y: number, maxHeightBlocks: number, blockSize: number): number => {
    // Convert world coordinates to block coordinates for noise sampling
    // The noise function expects block coordinates (as used in chunk generation)
    const blockX = x / blockSize;
    const blockY = y / blockSize;
    
    const noiseValue = fractalNoise(blockX, blockY, 0.15, 4);
    const terrainHeightBlocks = Math.floor(1 + noiseValue * noiseValue * (maxHeightBlocks - 1)) + 1;
    // Convert block height to world units by multiplying by blockSize
    return terrainHeightBlocks * blockSize;
};

