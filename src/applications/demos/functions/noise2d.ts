// Simple 2D value noise function
const noise2D = (x: number, y: number): number => {
    // Generate a pseudo-random value based on coordinates
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
};

// Smooth interpolation
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

// Interpolated noise
const smoothNoise = (x: number, y: number): number => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = smoothstep(x - x0);
    const sy = smoothstep(y - y0);

    const n00 = noise2D(x0, y0);
    const n10 = noise2D(x1, y0);
    const n01 = noise2D(x0, y1);
    const n11 = noise2D(x1, y1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;

    return nx0 * (1 - sy) + nx1 * sy;
};

export const fractalNoise = (x: number, y: number, octaves: number = 4): number => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        value += smoothNoise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    // Normalize to [-1, 1] range
    return (value / maxValue) * 2 - 1;
}; 