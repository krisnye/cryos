import { describe, it, expect } from "vitest";
import { createStaticVoxelChunk } from "./create-static-voxel-chunk.js";
import { calculateInvisibleFlags } from "./calculate-invisible-flags.js";
import { 
    FRONT_FACE_VISIBLE,
    RIGHT_FACE_VISIBLE,
    BACK_FACE_VISIBLE,
    LEFT_FACE_VISIBLE,
    TOP_FACE_VISIBLE,
    BOTTOM_FACE_VISIBLE,
    ALL_FACES_VISIBLE_MASK
} from "../static-voxel/static-voxel-flags.js";
import { updateStructureMapFromPositionArray } from "../generic-chunk/from-position-array.js";
import { Vec3 } from "math/index.js";
import { StaticVoxel } from "../static-voxel/static-voxel.js";

describe('calculateInvisibleFlags', () => {
    it('should mark interior voxels as completely invisible (flags = 0)', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a simple 3x3x3 cube structure
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            // Bottom layer (z=0)
            { position: [0, 0, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            
            // Middle layer (z=1)
            { position: [0, 0, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 }, // This should be interior
            { position: [2, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            
            // Top layer (z=2)
            { position: [0, 0, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 2] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the center voxel (1, 1, 1) which should be interior
        const centerTileIndex = 1 * 3 + 1; // y=1, x=1
        const centerTile = chunk.tiles.get(centerTileIndex);
        
        // Find the voxel at height 1 in the center column
        let centerVoxel = null;
        for (let i = 0; i < centerTile.dataLength; i++) {
            const voxel = chunk.blocks.get(centerTile.dataIndex + i);
            if (voxel.height === 1) {
                centerVoxel = voxel;
                break;
            }
        }
        
        expect(centerVoxel).not.toBeNull();
        // Interior voxel should have no visible faces (flags = 0)
        expect(centerVoxel!.flags).toBe(0);
        // Face visibility mask should be 0
        expect(centerVoxel!.flags & ALL_FACES_VISIBLE_MASK).toBe(0);
    });
    
    it('should mark surface voxels as having visible faces', () => {
        const chunk = createStaticVoxelChunk(2);
        
        // Create a simple 2x2x2 cube (all voxels are surface voxels)
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [0, 0, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 0] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 0, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Check that all voxels have at least some visible faces (not completely surrounded)
        for (let i = 0; i < chunk.blocks.size; i++) {
            const voxel = chunk.blocks.get(i);
            expect(voxel.flags).toBeGreaterThan(0);
            expect(voxel.flags & ALL_FACES_VISIBLE_MASK).toBeGreaterThan(0);
        }
    });
    
    it('should handle empty chunks', () => {
        const chunk = createStaticVoxelChunk(4);
        calculateInvisibleFlags(chunk);
        
        // Should not throw any errors
        expect(chunk.size).toBe(4);
    });
    
    it('should correctly identify individual face visibility', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a single voxel at (1, 1, 1) - should have all faces visible
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the voxel
        const tileIndex = 1 * 3 + 1; // y=1, x=1
        const tile = chunk.tiles.get(tileIndex);
        const voxel = chunk.blocks.get(tile.dataIndex);
        
        // Should have all faces visible
        expect(voxel.flags).toBe(ALL_FACES_VISIBLE_MASK);
        expect(voxel.flags & FRONT_FACE_VISIBLE).toBe(FRONT_FACE_VISIBLE);
        expect(voxel.flags & RIGHT_FACE_VISIBLE).toBe(RIGHT_FACE_VISIBLE);
        expect(voxel.flags & BACK_FACE_VISIBLE).toBe(BACK_FACE_VISIBLE);
        expect(voxel.flags & LEFT_FACE_VISIBLE).toBe(LEFT_FACE_VISIBLE);
        expect(voxel.flags & TOP_FACE_VISIBLE).toBe(TOP_FACE_VISIBLE);
        expect(voxel.flags & BOTTOM_FACE_VISIBLE).toBe(BOTTOM_FACE_VISIBLE);
    });
    
    it('should correctly identify partially covered voxels', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create two adjacent voxels - each should have some faces covered
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 1] as Vec3, type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the first voxel (1, 1, 1)
        const tileIndex1 = 1 * 3 + 1; // y=1, x=1
        const tile1 = chunk.tiles.get(tileIndex1);
        const voxel1 = chunk.blocks.get(tile1.dataIndex);
        
        // Find the second voxel (2, 1, 1)
        const tileIndex2 = 1 * 3 + 2; // y=1, x=2
        const tile2 = chunk.tiles.get(tileIndex2);
        const voxel2 = chunk.blocks.get(tile2.dataIndex);
        
        // First voxel should have right face covered (no RIGHT_FACE_VISIBLE flag)
        expect(voxel1.flags & RIGHT_FACE_VISIBLE).toBe(0);
        expect(voxel1.flags & LEFT_FACE_VISIBLE).toBe(LEFT_FACE_VISIBLE);
        
        // Second voxel should have left face covered (no LEFT_FACE_VISIBLE flag)
        expect(voxel2.flags & LEFT_FACE_VISIBLE).toBe(0);
        expect(voxel2.flags & RIGHT_FACE_VISIBLE).toBe(RIGHT_FACE_VISIBLE);
    });
    
    it('should work correctly when other flags are present', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a single voxel at (1, 1, 1) with additional flags
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1] as Vec3, type: 1, flags: 0b1000000, damage: 0, temp: 0 }, // Has additional flag
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the voxel
        const tileIndex = 1 * 3 + 1; // y=1, x=1
        const tile = chunk.tiles.get(tileIndex);
        const voxel = chunk.blocks.get(tile.dataIndex);
        
        // Should have all faces visible plus the original additional flag
        const expectedFlags = ALL_FACES_VISIBLE_MASK | 0b1000000;
        expect(voxel.flags).toBe(expectedFlags);
        
        // Face visibility mask should still work correctly
        expect(voxel.flags & ALL_FACES_VISIBLE_MASK).toBe(ALL_FACES_VISIBLE_MASK);
        
        // Individual face flags should still work
        expect(voxel.flags & FRONT_FACE_VISIBLE).toBe(FRONT_FACE_VISIBLE);
        expect(voxel.flags & RIGHT_FACE_VISIBLE).toBe(RIGHT_FACE_VISIBLE);
    });
}); 