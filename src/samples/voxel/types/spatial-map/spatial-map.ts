import { Entity } from "@adobe/data/ecs";

/**
 * SpatialMap represents a 3D spatial hash table for efficient entity lookup
 * 
 * Structure:
 * - Key: spatial hash (y << 16 | x) representing a 2D grid position
 * - Value: Array where index = height (Z), value = entity(ies) at that height
 * 
 * This allows for:
 * - Fast spatial queries using 2D hashing
 * - Multiple entities per (x,y,z) location
 * - Efficient height-based traversal
 */
export type SpatialMap = Map<number, Array<undefined | Entity | Entity[]>>;
