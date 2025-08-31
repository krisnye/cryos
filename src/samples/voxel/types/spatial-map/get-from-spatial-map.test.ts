import { describe, it, expect } from "vitest";
import { getFromSpatialMap } from "./get-from-spatial-map.js";
import { SpatialMap } from "./spatial-map.js";

describe("getFromSpatialMap", () => {
    it("should return undefined for empty spatial map", () => {
        const spatialMap: SpatialMap = new Map();
        const result = getFromSpatialMap(spatialMap, [0, 0, 0]);
        expect(result).toBeUndefined();
    });

    it("should return undefined for non-existent 2D position", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Query different 2D position
        const result = getFromSpatialMap(spatialMap, [5, 5, 1]);
        expect(result).toBeUndefined();
    });

    it("should return undefined for non-existent height", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (1, 1) with heights 0, 1, 2
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Query height 5 (doesn't exist)
        const result = getFromSpatialMap(spatialMap, [1, 1, 5]);
        expect(result).toBeUndefined();
    });

    it("should return single entity at exact position", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Query height 1
        const result = getFromSpatialMap(spatialMap, [1, 1, 1]);
        expect(result).toBe(20);
    });

    it("should return array of entities at position", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, [20, 25, 30], 40]; // single entity, array, single entity
        spatialMap.set(mapIndex, column);
        
        // Query height 1 (array of entities)
        const result = getFromSpatialMap(spatialMap, [1, 1, 1]);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([20, 25, 30]);
    });

    it("should handle Vec4 input correctly", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Query with Vec4 (should use first 3 components)
        const result = getFromSpatialMap(spatialMap, [1, 1, 1, 999]);
        expect(result).toBe(20);
    });

    it("should handle fractional coordinates by flooring to voxel bucket", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (0, 0) for coordinates that floor to [0, 0, z]
        const mapIndex00 = (0 << 16) | 0; // y=0, x=0
        const column00 = [100, 200, 300]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex00, column00);
        
        // Set up data at position (1, 1) for coordinates that floor to [1, 1, z]
        const mapIndex11 = (1 << 16) | 1; // y=1, x=1
        const column11 = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex11, column11);
        
        // Query with fractional coordinates (should floor to voxel bucket)
        const result1 = getFromSpatialMap(spatialMap, [1.1, 1.1, 1.1]);
        expect(result1).toBe(20); // [1.1, 1.1, 1.1] floors to [1, 1, 1] -> height 1 -> entity 20
        
        const result2 = getFromSpatialMap(spatialMap, [0.9, 0.9, 0.9]);
        expect(result2).toBe(100); // [0.9, 0.9, 0.9] floors to [0, 0, 0] -> height 0 -> entity 100
        
        const result3 = getFromSpatialMap(spatialMap, [1.9, 1.9, 1.9]);
        expect(result3).toBe(20); // [1.9, 1.9, 1.9] floors to [1, 1, 1] -> height 1 -> entity 20
    });

    it("should handle negative coordinates", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data at position (-1, -1)
        const mapIndex = (-1 << 16) | -1; // y=-1, x=-1
        const column = [100, 200, 300]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Query negative position
        const result = getFromSpatialMap(spatialMap, [-1, -1, 1]);
        expect(result).toBe(200);
    });

    it("should handle empty entity arrays", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data with empty array at height 1
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, [], 30]; // single entity, empty array, single entity
        spatialMap.set(mapIndex, column);
        
        // Query height 1 (empty array)
        const result = getFromSpatialMap(spatialMap, [1, 1, 1]);
        expect(result).toEqual([]);
    });

    it("should handle mixed entity types in column", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up data with mixed types
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [
            10,           // single entity at height 0
            [20, 25],     // array at height 1
            undefined,     // nothing at height 2
            40            // single entity at height 3
        ];
        spatialMap.set(mapIndex, column);
        
        // Test all heights
        expect(getFromSpatialMap(spatialMap, [1, 1, 0])).toBe(10);
        expect(getFromSpatialMap(spatialMap, [1, 1, 1])).toEqual([20, 25]);
        expect(getFromSpatialMap(spatialMap, [1, 1, 2])).toBeUndefined();
        expect(getFromSpatialMap(spatialMap, [1, 1, 3])).toBe(40);
    });
}); 