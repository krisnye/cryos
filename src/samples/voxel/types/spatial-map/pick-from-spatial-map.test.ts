import { describe, it, expect } from "vitest";
import { pickFromSpatialMap } from "./pick-from-spatial-map.js";
import { Line3 } from "math/line3/line3.js";
import { SpatialMap } from "./spatial-map.js";
import { Aabb } from "math/aabb/aabb.js";

describe("pickFromSpatialMap", () => {
    // Default bounds for unit-sized voxels
    const defaultBounds: Aabb = { min: [0.5, 0.5, 0.5], max: [1.5, 1.5, 1.5] };
    const getDefaultBounds = () => defaultBounds;
    
    it("should pick a static particle at exact ray intersection", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Manually set up spatialMap with a test particle at (1, 2, 3)
        const mapIndex = (2 << 16) | 1; // y=2, x=1
        const column = new Array(4).fill(undefined); // Initialize array with 4 elements
        column[3] = 42; // entity 42 at height 3
        spatialMap.set(mapIndex, column);
        
        // Create a ray that goes through the particle
        const pickLine: Line3 = {
            a: [0, 2, 3], // start at x=0, y=2, z=3
            b: [2, 2, 3]  // end at x=2, y=2, z=3
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        // The ray hits the voxel boundary at x=0.5, not the center
        expect(result!.position[0]).toBeCloseTo(0.5, 1);
        expect(result!.position[1]).toBe(2);
        expect(result!.position[2]).toBe(3);
        expect(result!.face).toBe(1); // POS_X face (ray going in +X direction)
    });
    
    it("should return null when no particle exists at intersection", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Empty spatialMap
        spatialMap.clear();
        
        const pickLine: Line3 = {
            a: [0, 0, 0],
            b: [1, 0, 0]
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).toBeNull();
    });
    
    it("should detect collision with radius > 0", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a particle at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined); // Initialize array with 2 elements
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Ray that passes near but not through the particle
        const pickLine: Line3 = {
            a: [0, 0.8, 1], // start near the particle
            b: [2, 0.8, 1]  // end near the particle
        };
        
        // With radius 0.5, should detect collision
        const result = pickFromSpatialMap(spatialMap, pickLine, 0.5, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        expect(result!.face).toBe(1); // POS_X face
    });
    
    it("should not detect collision when radius is too small", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a particle at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined); // Initialize array with 2 elements
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Ray that passes near but not through the particle
        const pickLine: Line3 = {
            a: [0, 0.8, 1], // start near the particle
            b: [2, 0.8, 1]  // end near the particle
        };
        
        // With radius 0, should not detect collision
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        // The ray actually passes through the voxel, so we expect a collision
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
    });
    
    it("should handle multiple particles and pick the first one encountered", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up particles at different heights in the same column
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = [10, 20, 30]; // entities at heights 0, 1, 2
        spatialMap.set(mapIndex, column);
        
        // Ray that goes through the column
        const pickLine: Line3 = {
            a: [1, 1, 0], // start at bottom
            b: [1, 1, 3]  // end at top
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(10); // should pick the first one encountered (height 0)
        // The ray is going in +Z direction, so face should be POS_Z (0)
        expect(result!.face).toBe(0); // POS_Z face (ray going in +Z direction)
    });
    
    it("should handle diagonal rays correctly", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a particle at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined); // Initialize array with 2 elements
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Diagonal ray
        const pickLine: Line3 = {
            a: [0, 0, 0], // start at origin
            b: [2, 2, 2]  // end at (2,2,2)
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        // Face should be determined by the dominant direction component
        expect([1, 4, 0]).toContain(result!.face); // POS_X, POS_Y, or POS_Z
    });

    it("should handle single entity (number) at a location", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a single entity at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = 42; // single entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        const pickLine: Line3 = {
            a: [0, 1, 1],
            b: [2, 1, 1]
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
    });

    it("should handle multiple entities (number[]) at a location and pick the first one", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up multiple entities at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = [42, 99, 123]; // multiple entities at height 1
        spatialMap.set(mapIndex, column);
        
        const pickLine: Line3 = {
            a: [0, 1, 1],
            b: [2, 1, 1]
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42); // should pick the first entity in the array
    });

    it("should skip empty entity arrays", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up an empty entity array at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = []; // empty array at height 1
        spatialMap.set(mapIndex, column);
        
        const pickLine: Line3 = {
            a: [0, 1, 1],
            b: [2, 1, 1]
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).toBeNull(); // should skip empty arrays
    });
    
    it("should handle different entity bounds using getVoxelBounds callback", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up entities with different bounds
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(4).fill(undefined);
        column[1] = 42; // entity 42 at height 1 (bounds [0, 0, 0] to [2, 2, 2])
        column[2] = 99; // entity 99 at height 2 (bounds [1.75, 1.75, 1.75] to [2.25, 2.25, 2.25])
        spatialMap.set(mapIndex, column);
        
        // Create a ray that goes through both entities
        const pickLine: Line3 = {
            a: [0, 1, 0], // start at x=0, y=1, z=0
            b: [2, 1, 3]  // end at x=2, y=1, z=3
        };
        
        // Mock getVoxelBounds function that returns different AABBs
        const getVoxelBounds = (entity: number): Aabb => {
            if (entity === 42) return { min: [0, 0, 0], max: [2, 2, 2] }; // Large entity
            if (entity === 99) return { min: [1.75, 1.75, 1.75], max: [2.25, 2.25, 2.25] }; // Small entity
            return { min: [0.5, 0.5, 0.5], max: [1.5, 1.5, 1.5] }; // Default bounds
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getVoxelBounds);
        
        expect(result).not.toBeNull();
        // Should pick the first entity encountered (entity 42 at height 1)
        expect(result!.entity).toBe(42);

        // The large entity extends from x=0 to x=2
        // Ray starts at x=0, so it should hit the entry boundary at x=0
        expect(result!.position[0]).toBeCloseTo(0, 1);
        expect(result!.position[1]).toBe(1);
        expect(result!.position[2]).toBe(0); // Ray starts at z=0, so intersection is at z=0
        // The ray is going in +Z direction, so face should be POS_Z (0)
        expect(result!.face).toBe(0); // POS_Z face (ray going in +Z direction)
    });
    
    it("should handle radius collision with different entity sizes", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a large entity
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(3).fill(undefined);
        column[1] = 42; // entity 42 at height 1 (size 3.0)
        spatialMap.set(mapIndex, column);
        
        // Ray that passes near but not through the large entity
        const pickLine: Line3 = {
            a: [0, 0.5, 1], // start near the entity
            b: [2, 0.5, 1]  // end near the entity
        };
        
        // Mock getVoxelSize function
        const getVoxelSize = (entity: number): number => {
            if (entity === 42) return 3.0; // Large entity
            return 1.0;
        };
        
        // With radius 0.5, should detect collision with the large entity
        const result = pickFromSpatialMap(spatialMap, pickLine, 0.5, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);

        // The large entity extends from x=-0.5 to x=2.5 (centered at x=1)
        // Ray starts at x=0, so it should hit the entry boundary at x=0
        expect(result!.position[0]).toBeCloseTo(0, 1);
        expect(result!.face).toBe(1); // POS_X face
    });
    
    it("should use default bounds when getVoxelBounds is not provided", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a test entity
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Create a ray that goes through the entity
        const pickLine: Line3 = {
            a: [0, 1, 1], // start at x=0, y=1, z=1
            b: [2, 1, 1]  // end at x=2, y=1, z=1
        };
        
        // Call with default bounds
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        // Default bounds [0.5, 0.5, 0.5] to [1.5, 1.5, 1.5]
        // Ray starts at x=0, so it should hit the boundary at x=0.5
        expect(result!.position[0]).toBeCloseTo(0.5, 1);
        expect(result!.face).toBe(1); // POS_X face
    });
}); 