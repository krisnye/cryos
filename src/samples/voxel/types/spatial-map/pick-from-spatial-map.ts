import { Line3 } from "math/line3/line3.js";
import { SpatialMap } from "./spatial-map.js";
import { Entity } from "@adobe/data/ecs";
import { getFromSpatialMap } from "./get-from-spatial-map.js";
import { Vec3, Vec4 } from "math/index.js";
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
 * Find the voxel containing a given position
 */
function findVoxelContaining(position: readonly [number, number, number]): [number, number, number] {
    return [
        Math.round(position[0]),
        Math.round(position[1]),
        Math.round(position[2])
    ];
}

/**
 * Find the next voxel boundary intersection along the ray
 */
function findNextVoxelIntersection(
    rayStart: readonly [number, number, number],
    rayDirNorm: readonly [number, number, number],
    currentVoxel: readonly [number, number, number]
): VoxelIntersection | null {
    // Calculate the current voxel boundaries
    const voxelMin = [currentVoxel[0] - 0.5, currentVoxel[1] - 0.5, currentVoxel[2] - 0.5];
    const voxelMax = [currentVoxel[0] + 0.5, currentVoxel[1] + 0.5, currentVoxel[2] + 0.5];
    
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
                
                // Calculate the intersection position
                const position: [number, number, number] = [
                    rayStart[0] + rayDirNorm[0] * alpha,
                    rayStart[1] + rayDirNorm[1] * alpha,
                    rayStart[2] + rayDirNorm[2] * alpha
                ];
                
                // Determine which face was hit
                const face = rayDirNorm[axis] > 0 ? 
                    (axis === 0 ? 1 : axis === 1 ? 4 : 0) : // POS_X, POS_Y, POS_Z
                    (axis === 0 ? 3 : axis === 1 ? 5 : 2);  // NEG_X, NEG_Y, NEG_Z
                
                // Calculate the next voxel (step in the direction of the ray)
                const nextVoxel: [number, number, number] = [...currentVoxel];
                if (rayDirNorm[axis] > 0) {
                    nextVoxel[axis] += 1;
                } else {
                    nextVoxel[axis] -= 1;
                }
                
                nextIntersection = {
                    voxel: nextVoxel,
                    position,
                    face
                };
            }
        }
    }
    
    return nextIntersection;
}

/**
 * Calculate intersection point of ray with voxel boundary
 */
function calculateRayIntersection(
    rayStart: readonly [number, number, number],
    rayDirNorm: readonly [number, number, number],
    entityBounds: Aabb,
    radius: number
): [number, number, number] {
    let intersectionAlpha = 0;
    
    // Check each axis to find the entry point
    for (let axis = 0; axis < 3; axis++) {
        if (rayDirNorm[axis] !== 0) {
            // Calculate intersection with the min and max planes of this axis
            // Apply radius expansion inline to avoid array allocation
            const minBound = entityBounds.min[axis] - radius;
            const maxBound = entityBounds.max[axis] + radius;
            
            const alphaMin = (minBound - rayStart[axis]) / rayDirNorm[axis];
            const alphaMax = (maxBound - rayStart[axis]) / rayDirNorm[axis];
            
            // Use the appropriate alpha based on ray direction
            const alpha = rayDirNorm[axis] > 0 ? alphaMin : alphaMax;
            
            // Update intersection alpha if this is the latest entry point
            if (alpha > intersectionAlpha) {
                intersectionAlpha = alpha;
            }
        }
    }
    
    // Calculate the actual intersection point
    return [
        rayStart[0] + rayDirNorm[0] * intersectionAlpha,
        rayStart[1] + rayDirNorm[1] * intersectionAlpha,
        rayStart[2] + rayDirNorm[2] * intersectionAlpha
    ];
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
    
    // Start with the voxel containing the ray start
    let currentVoxel = findVoxelContaining(rayProps.start);
    
    // Safety limit to prevent infinite loops (should never be hit with correct math)
    const maxIterations = 1000;
    let iterations = 0;
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Check for entities at this voxel
        const entityData = getFromSpatialMap(spatialMap, currentVoxel);
        
        if (entityData !== undefined) {
            // Extract entity ID from entity data (single entity or array)
            let entityId: number;
            if (Array.isArray(entityData)) {
                if (entityData.length === 0) {
                    // Continue to next voxel
                } else {
                    entityId = entityData[0];
                    
                    // Get the actual voxel bounds for this entity
                    const entityBounds = getVoxelBounds(entityId);
                    
                    // Calculate intersection point directly with radius expansion
                    const intersectionPoint = calculateRayIntersection(rayProps.start, rayProps.directionNormalized, entityBounds, radius);
                    
                    return {
                        entity: entityId,
                        position: intersectionPoint,
                        face: determineFaceFromRayDirection(rayProps.directionNormalized)
                    };
                }
            } else {
                entityId = entityData;
                
                // Get the actual voxel bounds for this entity
                const entityBounds = getVoxelBounds(entityId);
                
                // Calculate intersection point directly with radius expansion
                const intersectionPoint = calculateRayIntersection(rayProps.start, rayProps.directionNormalized, entityBounds, radius);
                
                return {
                    entity: entityId,
                    position: intersectionPoint,
                    face: determineFaceFromRayDirection(rayProps.directionNormalized)
                };
            }
        }
        
        // Find the next voxel boundary intersection
        const nextIntersection = findNextVoxelIntersection(rayProps.start, rayProps.directionNormalized, currentVoxel);
        
        if (!nextIntersection) {
            break; // No more intersections
        }
        
        // Check if we've gone beyond the ray length
        const distanceFromStart = Math.sqrt(
            Math.pow(nextIntersection.position[0] - rayProps.start[0], 2) +
            Math.pow(nextIntersection.position[1] - rayProps.start[1], 2) +
            Math.pow(nextIntersection.position[2] - rayProps.start[2], 2)
        );
        
        if (distanceFromStart > rayProps.length) {
            break; // Beyond ray length
        }
        
        // Move to the next voxel
        currentVoxel = nextIntersection.voxel;
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