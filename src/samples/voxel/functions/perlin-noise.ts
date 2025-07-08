/**
 * Deterministic Perlin noise implementation for terrain generation.
 * Based on a simplified version of Perlin noise that produces consistent results
 * for the same input coordinates.
 */

// Permutation table for noise generation
const P = new Uint8Array(512);
for (let i = 0; i < 256; i++) {
    P[i] = i;
    P[i + 256] = i;
}

// Fisher-Yates shuffle for deterministic results
let seed = 12345; // Fixed seed for deterministic results
const shuffle = () => {
    for (let i = 255; i > 0; i--) {
        const j = Math.floor((seed = (seed * 9301 + 49297) % 233280) / 233280 * (i + 1));
        [P[i], P[j]] = [P[j], P[i]];
        P[i + 256] = P[i];
    }
};
shuffle();

// Fade function for smooth interpolation
const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

// Lerp function for linear interpolation
const lerp = (t: number, a: number, b: number): number => a + t * (b - a);

// Grad function for gradient calculation
const grad = (hash: number, x: number, y: number, z: number): number => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

/**
 * 2D Perlin noise function with seamless tiling.
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param scale - Scale factor for the noise (default: 1.0)
 * @returns Noise value between -1 and 1
 */
export const perlinNoise2D = (x: number, y: number, scale: number = 1.0): number => {
    const scaledX = x * scale;
    const scaledY = y * scale;
    
    // Wrap coordinates to ensure seamless tiling
    const wrappedX = scaledX % 256;
    const wrappedY = scaledY % 256;
    
    // Handle negative coordinates
    const posX = wrappedX < 0 ? wrappedX + 256 : wrappedX;
    const posY = wrappedY < 0 ? wrappedY + 256 : wrappedY;
    
    const X = Math.floor(posX) & 255;
    const Y = Math.floor(posY) & 255;
    
    const xf = posX - Math.floor(posX);
    const yf = posY - Math.floor(posY);
    
    const u = fade(xf);
    const v = fade(yf);
    
    // Use modulo to ensure seamless wrapping
    const A = P[X] + Y;
    const AA = P[A];
    const AB = P[(A + 1) & 255];
    const B = P[(X + 1) & 255] + Y;
    const BA = P[B];
    const BB = P[(B + 1) & 255];
    
    const gAA = grad(AA, xf, yf, 0);
    const gBA = grad(BA, xf - 1, yf, 0);
    const gAB = grad(AB, xf, yf - 1, 0);
    const gBB = grad(BB, xf - 1, yf - 1, 0);
    
    const x1 = lerp(u, gAA, gBA);
    const x2 = lerp(u, gAB, gBB);
    
    return lerp(v, x1, x2);
};

/**
 * 3D Perlin noise function with seamless tiling in x and y directions.
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @param scale - Scale factor for the noise (default: 1.0)
 * @returns Noise value between -1 and 1
 */
export const perlinNoise3D = (x: number, y: number, z: number, scale: number = 1.0): number => {
    const scaledX = x * scale;
    const scaledY = y * scale;
    const scaledZ = z * scale;
    
    // Wrap only x and y coordinates for seamless tiling
    const wrappedX = scaledX % 256;
    const wrappedY = scaledY % 256;
    
    // Handle negative coordinates
    const posX = wrappedX < 0 ? wrappedX + 256 : wrappedX;
    const posY = wrappedY < 0 ? wrappedY + 256 : wrappedY;
    
    const X = Math.floor(posX) & 255;
    const Y = Math.floor(posY) & 255;
    const Z = Math.floor(scaledZ) & 255;
    
    const xf = posX - Math.floor(posX);
    const yf = posY - Math.floor(posY);
    const zf = scaledZ - Math.floor(scaledZ);
    
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    
    // Use modulo to ensure seamless wrapping for x and y
    const A = P[X] + Y;
    const AA = P[A] + Z;
    const AB = P[(A + 1) & 255] + Z;
    const B = P[(X + 1) & 255] + Y;
    const BA = P[B] + Z;
    const BB = P[(B + 1) & 255] + Z;
    
    const gAAA = grad(P[AA], xf, yf, zf);
    const gBAA = grad(P[BA], xf - 1, yf, zf);
    const gABA = grad(P[AB], xf, yf - 1, zf);
    const gBBA = grad(P[BB], xf - 1, yf - 1, zf);
    const gAAB = grad(P[AA + 1], xf, yf, zf - 1);
    const gBAB = grad(P[BA + 1], xf - 1, yf, zf - 1);
    const gABB = grad(P[AB + 1], xf, yf - 1, zf - 1);
    const gBBB = grad(P[BB + 1], xf - 1, yf - 1, zf - 1);
    
    const x1 = lerp(u, gAAA, gBAA);
    const x2 = lerp(u, gABA, gBBA);
    const x3 = lerp(u, gAAB, gBAB);
    const x4 = lerp(u, gABB, gBBB);
    
    const y1 = lerp(v, x1, x2);
    const y2 = lerp(v, x3, x4);
    
    return lerp(w, y1, y2);
}; 