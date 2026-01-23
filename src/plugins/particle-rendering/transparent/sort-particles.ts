// Utility to sort particles by depth from camera position

import { Vec3 } from "@adobe/data/math";

/**
 * Build a flat Float32Array containing all particle positions (Vec3 per particle = 3 floats)
 * @param tables - Array of archetype tables containing particles with position component
 * @param particleCount - Total number of particles across all tables
 * @param out - Output Float32Array to write positions to (must be at least particleCount * 3 in length)
 */
export function buildFlatPositionBuffer(
    tables: readonly { columns: { position: { getTypedArray(): ArrayLike<number> & { length: number } } }; rowCount: number }[],
    particleCount: number,
    out: Float32Array
): void {
    let offset = 0;
    
    for (const table of tables) {
        const tablePositions = table.columns.position.getTypedArray() as Float32Array;
        const tableSize = table.rowCount * 3;
        // Only copy the actual data we need (tablePositions might be larger due to capacity)
        const sourceView = tablePositions.subarray(0, tableSize);
        out.set(sourceView, offset);
        offset += tableSize;
    }
}

/**
 * Sort particle indices by depth from camera position (furthest first, back-to-front)
 * Reads positions from a flat Float32Array, computes depth once per particle, then sorts.
 * @param positions - Flat Float32Array of positions: [x0, y0, z0, x1, y1, z1, ...]
 * @param indices - Uint32Array view to sort (may be a subarray of a larger buffer)
 * @param cameraPosition - Camera position in world space
 * @param depths - Reusable Float32Array for storing depths indexed by particle index (will be resized if needed)
 */
export function sortIndicesByDepth(
    positions: Float32Array,
    indices: Uint32Array,
    cameraPosition: Vec3,
    depths: Float32Array
): void {
    const cx = cameraPosition[0];
    const cy = cameraPosition[1];
    const cz = cameraPosition[2];
    const count = indices.length;
    
    // Compute depth squared once for each particle index (avoiding sqrt)
    // depths[particleIndex] = depth of that particle
    for (let i = 0; i < count; i++) {
        const particleIndex = indices[i];
        const posIdx = particleIndex * 3;
        const dx = positions[posIdx] - cx;
        const dy = positions[posIdx + 1] - cy;
        const dz = positions[posIdx + 2] - cz;
        depths[particleIndex] = dx * dx + dy * dy + dz * dz;
    }
    
    // Sort indices by pre-computed depths (descending: furthest first = back-to-front)
    // depths[a] and depths[b] are the depths of particles a and b
    indices.sort((a, b) => {
        return depths[b] - depths[a]; // Descending order
    });
}

