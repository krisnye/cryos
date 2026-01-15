// Utility to sort particles by depth from camera position

import { Vec3 } from "@adobe/data/math";
import { ReadonlyArchetype } from "@adobe/data/ecs";

/**
 * Particle reference with depth for sorting
 */
type ParticleRef = {
    tableIndex: number;
    rowIndex: number;
    depth: number;
};

/**
 * Sort particles by depth from camera position (furthest first, back-to-front)
 * @param tables - Array of archetype tables containing particles
 * @param cameraPosition - Camera position in world space
 * @returns Sorted array of indices [tableIndex, rowIndex] pairs
 */
export function sortParticlesByDepth(
    tables: readonly ReadonlyArchetype<any>[],
    cameraPosition: Vec3
): Array<{ tableIndex: number; rowIndex: number }> {
    // Collect all particle references with their depths
    const particleRefs: ParticleRef[] = [];
    
    for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
        const table = tables[tableIndex];
        const positions = table.columns.position;
        
        for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex++) {
            const position = positions.get(rowIndex) as Vec3;
            const depth = Vec3.distance(cameraPosition, position);
            
            particleRefs.push({ tableIndex, rowIndex, depth });
        }
    }
    
    // Sort by depth descending (furthest first = back-to-front)
    particleRefs.sort((a, b) => b.depth - a.depth);
    
    // Return sorted indices
    return particleRefs.map(ref => ({ tableIndex: ref.tableIndex, rowIndex: ref.rowIndex }));
}

