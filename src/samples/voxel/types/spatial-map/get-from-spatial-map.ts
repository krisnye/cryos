import { Entity } from "@adobe/data/ecs";
import { Vec3, Vec4 } from "math/index.js";
import { SpatialMap } from "./spatial-map.js";
import { getSpatialMapKey } from "./get-spatial-map-key.js";

/**
 * Simple spatial lookup function that returns entities at a given position
 * 
 * @param spatialMap - The spatial map to query
 * @param position - 3D or 4D position to look up
 * @returns Entity, array of entities, or undefined if nothing at that position
 */
export function getFromSpatialMap(
    spatialMap: SpatialMap, 
    position: Vec3 | Vec4
): Entity | Entity[] | undefined {
    const [x, y, z] = position;
    
    // Floor all coordinates to get the voxel bucket (consistent with spatial hashing)
    const voxelX = Math.floor(x);
    const voxelY = Math.floor(y);
    const voxelZ = Math.floor(z);
    
    // Get the 2D spatial hash key
    const mapIndex = getSpatialMapKey(voxelX, voxelY);
    
    // Get the column for this 2D position
    const column = spatialMap.get(mapIndex);
    if (!column) {
        return undefined;
    }
    
    // Get entities at the specific height (Z coordinate)
    return column[voxelZ];
} 