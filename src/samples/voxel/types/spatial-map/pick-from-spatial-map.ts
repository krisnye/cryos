import { Line3 } from "math/line3/line3.js";
import { SpatialMap } from "./spatial-map.js";
import { Entity } from "@adobe/data/ecs";
import { getFromSpatialMap } from "./get-from-spatial-map.js";
import { Aabb } from "math/aabb/aabb.js";

export interface PickResult {
    entity: number;
    position: readonly [number, number, number];
    face: number; // 0-5: POS_Z, 1=POS_X, 2=NEG_Z, 3=NEG_X, 4=POS_Y, 5=NEG_Y
}

interface RayProperties {
    start: readonly [number, number, number];
    end: readonly [number, number, number];
    direction: readonly [number, number, number];
    length: number;
    directionNormalized: readonly [number, number, number];
}

interface VoxelIntersection {
    voxel: [number, number, number];
    position: [number, number, number];
    face: number;
}

/**
 * Calculate ray properties from a Line3
 */
function calculateRayProperties(pickLine: Line3): RayProperties {
    const start = pickLine.a;
    const end = pickLine.b;
    
    const direction: [number, number, number] = [
        end[0] - start[0],
        end[1] - start[1], 
        end[2] - start[2]
    ];
    
    const length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
    
    const directionNormalized: [number, number, number] = [
        direction[0] / length,
        direction[1] / length,
        direction[2] / length
    ];
    
    return { start, end, direction, length, directionNormalized };
}

/**
 * Find the next voxel boundary intersection along the ray
 */
function findNextVoxelIntersection(
    rayStart: readonly [number, number, number],
    rayDirNorm: readonly [number, number, number],
    currentVoxel: readonly [number, number, number]
): VoxelIntersection | null {
    // Pre-allocate reusable arrays to avoid allocations in the loop
    const voxelMin: [number, number, number] = [0, 0, 0];
    const voxelMax: [number, number, number] = [0, 0, 0];
    const position: [number, number, number] = [0, 0, 0];
    const nextVoxel: [number, number, number] = [0, 0, 0];
    
    // Calculate the current voxel boundaries
    voxelMin[0] = currentVoxel[0] - 0.5;
    voxelMin[1] = currentVoxel[1] - 0.5;
    voxelMin[2] = currentVoxel[2] - 0.5;
    voxelMax[0] = currentVoxel[0] + 0.5;
    voxelMax[1] = currentVoxel[1] + 0.5;
    voxelMax[2] = currentVoxel[2] + 0.5;
    
    let nextIntersection: VoxelIntersection | null = null;
    let minAlpha = Infinity;
    
    // Check each axis for the next boundary intersection
    for (let axis = 0; axis < 3; axis++) {
        if (rayDirNorm[axis] !== 0) {
            // Calculate intersection with the min and max planes of this axis
            const alphaMin = (voxelMin[axis] - rayStart[axis]) / rayDirNorm[axis];
            const alphaMax = (voxelMax[axis] - rayStart[axis]) / rayDirNorm[axis];
            
            // Use the appropriate alpha based on ray direction
            const alpha = rayDirNorm[axis] > 0 ? alphaMax : alphaMin;
            
            // Only consider intersections in the forward direction
            if (alpha > 0 && alpha < minAlpha) {
                minAlpha = alpha;
                
                // Calculate the intersection position (reuse existing array)
                position[0] = rayStart[0] + rayDirNorm[0] * alpha;
                position[1] = rayStart[1] + rayDirNorm[1] * alpha;
                position[2] = rayStart[2] + rayDirNorm[2] * alpha;
                
                // Calculate the next voxel (reuse existing array)
                nextVoxel[0] = currentVoxel[0];
                nextVoxel[1] = currentVoxel[1];
                nextVoxel[2] = currentVoxel[2];
                if (rayDirNorm[axis] > 0) {
                    nextVoxel[axis] += 1;
                } else {
                    nextVoxel[axis] -= 1;
                }
                
                // Create or update the intersection result (avoid object allocation)
                if (!nextIntersection) {
                    nextIntersection = {
                        voxel: [nextVoxel[0], nextVoxel[1], nextVoxel[2]],
                        position: [position[0], position[1], position[2]],
                        face: 0 // Placeholder, not used in main loop
                    };
                } else {
                    // Reuse existing object by updating its properties
                    nextIntersection.voxel[0] = nextVoxel[0];
                    nextIntersection.voxel[1] = nextVoxel[1];
                    nextIntersection.voxel[2] = nextVoxel[2];
                    nextIntersection.position[0] = position[0];
                    nextIntersection.position[1] = position[1];
                    nextIntersection.position[2] = position[2];
                }
            }
        }
    }
    
    return nextIntersection;
}

/**
 * Calculate intersection point of ray with voxel boundary
 * OPTIMIZED: Reuses provided position array to avoid allocation
 */
function calculateRayIntersection(
    rayStart: readonly [number, number, number],
    rayDirNorm: readonly [number, number, number],
    entityBounds: Aabb,
    radius: number,
    position: [number, number, number] // Reuse this array
): void {
    let intersectionAlpha = 0;
    
    // OPTIMIZATION: Cache ray start and direction values to reduce array access
    const startX = rayStart[0];
    const startY = rayStart[1];
    const startZ = rayStart[2];
    const dirX = rayDirNorm[0];
    const dirY = rayDirNorm[1];
    const dirZ = rayDirNorm[2];
    
    // Check each axis for the next boundary intersection
    // OPTIMIZATION: Unroll the loop to avoid array access overhead
    if (dirX !== 0) {
        const minBoundX = entityBounds.min[0] - radius;
        const maxBoundX = entityBounds.max[0] + radius;
        const alphaMinX = (minBoundX - startX) / dirX;
        const alphaMaxX = (maxBoundX - startX) / dirX;
        const alphaX = dirX > 0 ? alphaMinX : alphaMaxX;
        if (alphaX > intersectionAlpha) {
            intersectionAlpha = alphaX;
        }
    }
    
    if (dirY !== 0) {
        const minBoundY = entityBounds.min[1] - radius;
        const maxBoundY = entityBounds.max[1] + radius;
        const alphaMinY = (minBoundY - startY) / dirY;
        const alphaMaxY = (maxBoundY - startY) / dirY;
        const alphaY = dirY > 0 ? alphaMinY : alphaMaxY;
        if (alphaY > intersectionAlpha) {
            intersectionAlpha = alphaY;
        }
    }
    
    if (dirZ !== 0) {
        const minBoundZ = entityBounds.min[2] - radius;
        const maxBoundZ = entityBounds.max[2] + radius;
        const alphaMinZ = (minBoundZ - startZ) / dirZ;
        const alphaMaxZ = (maxBoundZ - startZ) / dirZ;
        const alphaZ = dirZ > 0 ? alphaMinZ : alphaMaxZ;
        if (alphaZ > intersectionAlpha) {
            intersectionAlpha = alphaZ;
        }
    }
    
    // Calculate the actual intersection point (reuse provided array)
    position[0] = startX + dirX * intersectionAlpha;
    position[1] = startY + dirY * intersectionAlpha;
    position[2] = startZ + dirZ * intersectionAlpha;
}

/**
 * Picks static particles using voxel spatial lookup instead of ray-AABB intersection
 * This is much more efficient for voxel-based worlds with standard unit sizes
 * 
 * @param spatialMap - The spatial map containing the spatial lookup data
 * @param pickLine - The Line3 representing the ray for picking
 * @param radius - Optional radius for collision detection of larger objects (default: 0)
 * @returns PickResult with entity, position, and face, or null if nothing picked
 */
export function pickFromSpatialMap(
    spatialMap: SpatialMap,
    pickLine: Line3,
    radius: number = 0,
    getVoxelBounds: (entity: Entity) => Aabb,
): PickResult | null {
    
    // Calculate ray properties
    const rayProps = calculateRayProperties(pickLine);
    
    // Cache ray properties for faster comparisons (avoid repeated calculations)
    const rayStart = rayProps.start;
    const rayDirNorm = rayProps.directionNormalized;
    const rayLengthSquared = rayProps.length * rayProps.length;
    
    // OPTIMIZATION: Cache ray start values to reduce array access overhead
    const startX = rayStart[0];
    const startY = rayStart[1];
    const startZ = rayStart[2];
    
    // Pre-calculate face determination once (avoid function calls in inner loop)
    const hitFace = determineFaceFromRayDirection(rayDirNorm);
    
    // Start with the voxel containing the ray start
    let currentVoxel: [number, number, number] = [
        Math.round(rayStart[0]),
        Math.round(rayStart[1]),
        Math.round(rayStart[2])
    ];
    
    // Pre-allocate reusable arrays to avoid allocations in the hot path
    const tempPosition: [number, number, number] = [0, 0, 0];
    const resultPosition: [number, number, number] = [0, 0, 0];
    
    // Safety limit to prevent infinite loops (should never be hit with correct math)
    const maxIterations = 1000;
    let iterations = 0;
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Check for entities at this voxel
        const entityData = getFromSpatialMap(spatialMap, currentVoxel);
        
        // Early exit optimization: skip processing if no entities
        if (entityData === undefined) {
            // Find the next voxel boundary intersection
            const nextIntersection = findNextVoxelIntersection(rayStart, rayDirNorm, currentVoxel);
            
            if (!nextIntersection) {
                break; // No more intersections
            }
            
            // Check if we've gone beyond the ray length using squared distance
            const distanceFromStartSquared = 
                (nextIntersection.position[0] - startX) * (nextIntersection.position[0] - startX) +
                (nextIntersection.position[1] - startY) * (nextIntersection.position[1] - startY) +
                (nextIntersection.position[2] - startZ) * (nextIntersection.position[2] - startZ);
            
            if (distanceFromStartSquared > rayLengthSquared) {
                break; // Beyond ray length
            }
            
            // Move to the next voxel (reuse existing array to avoid allocation)
            currentVoxel[0] = nextIntersection.voxel[0];
            currentVoxel[1] = nextIntersection.voxel[1];
            currentVoxel[2] = nextIntersection.voxel[2];
            continue;
        }
        
        let closestEntity: number | null = null;
        let closestDistanceSquared = Infinity;
        
        // Handle both single entity and array of entities
        const entities = Array.isArray(entityData) ? entityData : [entityData];
        
        // OPTIMIZED INNER LOOP: No object allocation, reuse arrays
        for (const entityId of entities) {
            if (entityId === undefined) continue;
            
            // Get the actual voxel bounds for this entity
            const entityBounds = getVoxelBounds(entityId);
            
            // Calculate intersection point directly with radius expansion (reuse tempPosition)
            calculateRayIntersection(rayStart, rayDirNorm, entityBounds, radius, tempPosition);
            
            // Calculate squared distance from ray start to intersection point
            const dx = tempPosition[0] - startX;
            const dy = tempPosition[1] - startY;
            const dz = tempPosition[2] - startZ;
            const distanceSquared = dx * dx + dy * dy + dz * dz;
            
            // Update closest entity if this one is closer
            if (distanceSquared < closestDistanceSquared) {
                closestDistanceSquared = distanceSquared;
                closestEntity = entityId;
                
                // Copy position to result array (avoid allocation)
                resultPosition[0] = tempPosition[0];
                resultPosition[1] = tempPosition[1];
                resultPosition[2] = tempPosition[2];
            }
        }
        
        // Return the closest entity if we found one
        if (closestEntity !== null) {
            return {
                entity: closestEntity,
                position: resultPosition,
                face: hitFace
            };
        }
        
        // Find the next voxel boundary intersection
        const nextIntersection = findNextVoxelIntersection(rayStart, rayDirNorm, currentVoxel);
        
        if (!nextIntersection) {
            break; // No more intersections
        }
        
        // Check if we've gone beyond the ray length using squared distance
        const distanceFromStartSquared = 
            (nextIntersection.position[0] - startX) * (nextIntersection.position[0] - startX) +
            (nextIntersection.position[1] - startY) * (nextIntersection.position[1] - startY) +
            (nextIntersection.position[2] - startZ) * (nextIntersection.position[2] - startZ);
        
        if (distanceFromStartSquared > rayLengthSquared) {
            break; // Beyond ray length
        }
        
        // Move to the next voxel (reuse existing array to avoid allocation)
        currentVoxel[0] = nextIntersection.voxel[0];
        currentVoxel[1] = nextIntersection.voxel[1];
        currentVoxel[2] = nextIntersection.voxel[2];
    }
    
    return null;
}

/**
 * Determines which face of a voxel was hit based on ray direction
 * @param rayDir Normalized ray direction vector
 * @returns Face index: 0=POS_Z, 1=POS_X, 2=NEG_Z, 3=NEG_X, 4=POS_Y, 5=NEG_Y
 */
function determineFaceFromRayDirection(rayDir: readonly [number, number, number]): number {
    // Find the component with the largest absolute value (dominant axis)
    const absX = Math.abs(rayDir[0]);
    const absY = Math.abs(rayDir[1]);
    const absZ = Math.abs(rayDir[2]);
    
    if (absX >= absY && absX >= absZ) {
        // X-axis face (NEG_X or POS_X)
        return rayDir[0] > 0 ? 1 : 3; // 1=POS_X, 3=NEG_X
    } else if (absY >= absZ) {
        // Y-axis face (NEG_Y or POS_Y)
        return rayDir[1] > 0 ? 4 : 5; // 4=POS_Y, 5=NEG_Y
    } else {
        // Z-axis face (NEG_Z or POS_Z)
        return rayDir[2] > 0 ? 0 : 2; // 0=POS_Z, 2=NEG_Z
    }
} 