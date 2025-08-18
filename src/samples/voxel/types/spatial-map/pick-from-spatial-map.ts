import { Line3 } from "math/line3/line3.js";
import { SpatialMap } from "./spatial-map.js";
import { Entity } from "@adobe/data/ecs";
import { getFromSpatialMap } from "./get-from-spatial-map.js";
import { Vec3, Vec4 } from "math/index.js";
import { Aabb } from "math/aabb/aabb.js";

export interface PickResult {
    entity: number;
    position: readonly [number, number, number];
    face: number; // 0-5: POS_Z, POS_X, NEG_Z, NEG_X, POS_Y, NEG_Y
}

interface RayProperties {
    start: readonly [number, number, number];
    end: readonly [number, number, number];
    direction: readonly [number, number, number];
    length: number;
    directionNormalized: readonly [number, number, number];
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
 * Advance ray position to next voxel
 */
function advanceRayPosition(
    currentPos: [number, number, number], 
    rayDirNorm: readonly [number, number, number], 
    stepSize: number
): void {
    currentPos[0] += rayDirNorm[0] * stepSize;
    currentPos[1] += rayDirNorm[1] * stepSize;
    currentPos[2] += rayDirNorm[2] * stepSize;
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
    
    // Calculate step size for voxel traversal
    const minStepSize = 0.5; // Minimum step size for unit voxels
    const stepSize = radius > 0 ? Math.min(minStepSize, radius * 0.5) : minStepSize;
    
    // Traverse the ray through voxel space
    let currentPos = [...rayProps.start] as [number, number, number];
    const maxSteps = Math.ceil(rayProps.length / stepSize);
    
    for (let step = 0; step < maxSteps; step++) {
        // Find which voxel contains the current position
        // Since voxels are centered on their positions, we need to find the voxel center
        // that's closest to the current position
        const voxelCenter: [number, number, number] = [
            Math.round(currentPos[0]),
            Math.round(currentPos[1]),
            Math.round(currentPos[2])
        ];
        
        // Use the simplified spatial lookup
        const entityData = getFromSpatialMap(spatialMap, voxelCenter);
        
        if (entityData !== undefined) {
            // Extract entity ID from entity data (single entity or array)
            let entityId: number;
            if (Array.isArray(entityData)) {
                if (entityData.length === 0) continue;
                entityId = entityData[0];
            } else {
                entityId = entityData;
            }
            
            // Get the actual voxel bounds for this entity
            const entityBounds = getVoxelBounds(entityId);
            
            // Calculate intersection point directly with radius expansion
            const intersectionPoint = calculateRayIntersection(rayProps.start, rayProps.directionNormalized, entityBounds, radius);
            
            // Determine which face was hit based on ray direction
            const face = determineFaceFromRayDirection(rayProps.directionNormalized);
            
            return {
                entity: entityId,
                position: intersectionPoint,
                face
            };
        }
        
        // Move to next voxel along the ray
        advanceRayPosition(currentPos, rayProps.directionNormalized, stepSize);
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