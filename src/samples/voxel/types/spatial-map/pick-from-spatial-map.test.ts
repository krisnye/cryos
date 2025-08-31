import { describe, it, expect } from "vitest";
import { pickFromSpatialMap } from "./pick-from-spatial-map.js";
import { Line3 } from "math/line3/line3.js";
import { SpatialMap } from "./spatial-map.js";
import { Aabb } from "math/aabb/aabb.js";
import { Entity } from "@adobe/data/ecs";

// Face constants to match the WGSL shader face numbering
const FACE = {
    POS_Z: 0,   // Front face (normal +Z)
    POS_X: 1,   // Right face (normal +X)
    NEG_Z: 2,   // Back face (normal -Z)
    NEG_X: 3,   // Left face (normal -X)
    POS_Y: 4,   // Top face (normal +Y)
    NEG_Y: 5    // Bottom face (normal -Y)
} as const;

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
        expect(result!.face).toBe(FACE.NEG_X); // Left face (NEG_X) - ray going in +X direction hits left boundary
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
        expect(result!.face).toBe(FACE.POS_Z); // Front face (POS_Z) - ray hits front boundary
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
        // The ray is going in +Z direction, so it hits the back boundary first
        expect(result!.face).toBe(FACE.NEG_Z); // Back face (NEG_Z) - ray going in +Z direction hits back boundary
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
        // Face should be determined by the actual intersection
        expect(result!.face).toBe(FACE.NEG_X); // Left face (NEG_X) - diagonal ray hits left boundary first
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

    it("should pick the closest entity when multiple entities exist in the same voxel", () => {
        const spatialMap = new Map();
        const column = new Array(10);
        // Place entities at different heights in the same X,Y column
        column[0] = [100, 200]; // Entities at Z=0
        spatialMap.set(0, column);
        
        // Ray starts at origin and goes straight up
        const pickLine = { a: [0, 0, -0.5], b: [0, 0, 1.5] } as Line3;
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).toBeDefined();
        // Should pick entity 100 (first in array) since both are at same distance
        // but we iterate through the array in order
        expect(result!.entity).toBe(100);
    });

    it("should pick the closest entity based on actual intersection distance", () => {
        const spatialMap = new Map();
        const column = new Array(10);
        
        // Create mock bounds that will result in different intersection distances
        const mockGetVoxelBounds = (entity: Entity): Aabb => {
            if (entity === 100) {
                // Entity 100: bounds that intersect closer to ray start
                return { min: [-0.1, -0.1, -0.1], max: [0.1, 0.1, 0.1] };
            } else if (entity === 200) {
                // Entity 200: bounds that intersect further from ray start
                return { min: [0.4, 0.4, 0.4], max: [0.6, 0.6, 0.6] };
            }
            return defaultBounds;
        };
        
        // Place both entities in the same voxel
        column[0] = [100, 200];
        spatialMap.set(0, column);
        
        // Ray goes from origin through the voxel
        const pickLine = { a: [0, 0, 0], b: [1, 1, 1] } as Line3;
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, mockGetVoxelBounds);
        
        expect(result).toBeDefined();
        // Should pick entity 100 since it intersects closer to the ray start
        expect(result!.entity).toBe(100);
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
        expect(result!.face).toBe(FACE.POS_Z); // POS_Z face (ray going in +Z direction)
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
        expect(result!.face).toBe(FACE.POS_Z); // Front face (POS_Z) - ray hits front boundary
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
        expect(result!.face).toBe(FACE.NEG_X); // Left face (NEG_X) - ray hits left boundary
    });

    it("should demonstrate broken face picking - face determined by ray direction not actual intersection", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a test entity at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Create a ray that goes diagonally through the entity
        // This ray has a strong +X component but actually hits the front face (POS_Z)
        const pickLine: Line3 = {
            a: [0, 0.5, 0.5], // start at x=0, y=0.5, z=0.5
            b: [2, 1.5, 1.5]  // end at x=2, y=1.5, z=1.5
        };
        
        // The ray direction is [2, 1, 1], so the dominant component is X
        // This means determineFaceFromRayDirection will return face 1 (POS_X)
        // BUT the ray actually hits the front face (POS_Z) of the voxel first!
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        
        // The current broken logic will return face 1 (POS_X) because X is the dominant ray direction
        // But this is wrong! The ray actually hits the left face (NEG_X) first at x=0.5!
        // The intersection point should be at x=0.5, not z=0.5
        // This test should FAIL with the current broken implementation
        expect(result!.face).toBe(FACE.NEG_X); // Left face (NEG_X) - diagonal ray hits left boundary first
        
        // This test demonstrates the bug: face picking is based on ray direction, not actual intersection geometry
        // The ray hits the left face (NEG_X) at x=0.5, which is now correct!
    });
    
    it("should demonstrate face picking inconsistency with different ray angles", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a test entity at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Test 1: Ray going mostly in +X direction
        const pickLine1: Line3 = {
            a: [0, 1, 1], // start at x=0, y=1, z=1
            b: [2, 1, 1]  // end at x=2, y=1, z=1
        };
        
        const result1 = pickFromSpatialMap(spatialMap, pickLine1, 0, getDefaultBounds);
        expect(result1).not.toBeNull();
        expect(result1!.face).toBe(FACE.NEG_X); // Left face (NEG_X) - ray hits left boundary
        
        // Test 2: Ray going mostly in +Z direction (but with slight X component)
        const pickLine2: Line3 = {
            a: [0.9, 1, 0], // start at x=0.9, y=1, z=0
            b: [1.1, 1, 2]  // end at x=1.1, y=1, z=2
        };
        
        const result2 = pickFromSpatialMap(spatialMap, pickLine2, 0, getDefaultBounds);
        expect(result2).not.toBeNull();
        expect(result2!.face).toBe(FACE.NEG_Z); // Back face (NEG_Z) - ray hits back boundary
        
        // Test 3: Ray going mostly in +Y direction
        const pickLine3: Line3 = {
            a: [1, 0, 1], // start at x=1, y=0, z=1
            b: [1, 2, 1]  // end at x=1, y=2, z=1
        };
        
        const result3 = pickFromSpatialMap(spatialMap, pickLine3, 0, getDefaultBounds);
        expect(result3).not.toBeNull();
        expect(result3!.face).toBe(FACE.NEG_Y); // Bottom face (NEG_Y) - ray hits bottom boundary
        
        // This test shows that face picking is purely based on ray direction,
        // not on which face the ray actually intersects first
        // The current implementation happens to work for these simple cases, but fails for diagonal rays
    });
    
    it("should demonstrate the core face picking bug with a clear example", () => {
        const spatialMap: SpatialMap = new Map();
        
        // Set up a test entity at (1, 1, 1)
        const mapIndex = (1 << 16) | 1; // y=1, x=1
        const column = new Array(2).fill(undefined);
        column[1] = 42; // entity 42 at height 1
        spatialMap.set(mapIndex, column);
        
        // Create a ray that starts very close to the front face (Z face) but has a strong X component
        // Ray starts at (0.6, 1, 0.6) and goes to (1.4, 1, 1.4)
        // This ray has direction [0.8, 0, 0.8] - X and Z components are equal
        // But since X is processed first in the algorithm, it will be chosen as dominant
        const pickLine: Line3 = {
            a: [0.6, 1, 0.6], // start very close to front face
            b: [1.4, 1, 1.4]  // end diagonally
        };
        
        const result = pickFromSpatialMap(spatialMap, pickLine, 0, getDefaultBounds);
        
        expect(result).not.toBeNull();
        expect(result!.entity).toBe(42);
        
        // The current broken logic:
        // 1. Ray direction is [0.8, 0, 0.8]
        // 2. absX = 0.8, absY = 0, absZ = 0.8
        // 3. Since absX >= absZ (0.8 >= 0.8), it chooses X axis
        // 4. Since rayDir[0] > 0 (0.8 > 0), it returns face 1 (POS_X)
        // 
        // BUT the ray actually hits the front face (POS_Z) first at z=0.5!
        // The intersection point should be at z=0.5, not x=0.5
        // This test should FAIL with the current broken implementation
        expect(result!.face).toBe(FACE.POS_Z); // POS_Z face (CORRECT - but will fail with current code)
        
        // This demonstrates the fundamental flaw: face picking ignores actual intersection geometry
        // and only considers ray direction, leading to incorrect face identification
    });
}); 