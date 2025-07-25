import { describe, it, expect } from "vitest";
import { createStaticVoxelChunk } from "./create-static-voxel-chunk.js";
import { calculateInvisibleFlags } from "./calculate-invisible-flags.js";
import { 
    FRONT_FACE_INVISIBLE,
    RIGHT_FACE_INVISIBLE,
    BACK_FACE_INVISIBLE,
    LEFT_FACE_INVISIBLE,
    TOP_FACE_INVISIBLE,
    BOTTOM_FACE_INVISIBLE,
    ALL_FACES_INVISIBLE_MASK
} from "../static-voxel/static-voxel-flags.js";
import { updateStructureMapFromPositionArray } from "../generic-chunk/from-position-array.js";
import { Vec3 } from "math/index.js";
import { StaticVoxel } from "../static-voxel/static-voxel.js";

describe('calculateInvisibleFlags', () => {
    it('should mark interior voxels as completely invisible (flags = ALL_FACES_INVISIBLE_MASK)', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a simple 3x3x3 cube structure
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            // Bottom layer (z=0)
            { position: [0, 0, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            
            // Middle layer (z=1)
            { position: [0, 0, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 }, // This should be interior
            { position: [2, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            
            // Top layer (z=2)
            { position: [0, 0, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 0, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 2, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 2, 2], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 2, 2], type: 1, flags: 0, damage: 0, temp: 0 },
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
        // Interior voxel should have all faces invisible
        expect(centerVoxel!.flags).toBe(ALL_FACES_INVISIBLE_MASK);
        // Face invisibility mask should be ALL_FACES_INVISIBLE_MASK
        expect(centerVoxel!.flags & ALL_FACES_INVISIBLE_MASK).toBe(ALL_FACES_INVISIBLE_MASK);
    });
    
    it('should mark surface voxels as having some visible faces', () => {
        const chunk = createStaticVoxelChunk(2);
        
        // Create a simple 2x2x2 cube (all voxels are surface voxels)
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [0, 0, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 0], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 0, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 0, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [0, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [1, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Check that all voxels have at least some visible faces (not completely surrounded)
        for (let i = 0; i < chunk.blocks.capacity; i++) {
            const voxel = chunk.blocks.get(i);
            expect(voxel.flags).toBeLessThan(ALL_FACES_INVISIBLE_MASK);
            expect(voxel.flags & ALL_FACES_INVISIBLE_MASK).toBeLessThan(ALL_FACES_INVISIBLE_MASK);
        }
    });
    
    it('should handle empty chunks', () => {
        const chunk = createStaticVoxelChunk(4);
        calculateInvisibleFlags(chunk);
        
        // Should not throw any errors
        expect(chunk.size).toBe(4);
    });
    
    it('should correctly identify individual face invisibility', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a single voxel at (1, 1, 1) - should have no invisible faces
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the voxel
        const tileIndex = 1 * 3 + 1; // y=1, x=1
        const tile = chunk.tiles.get(tileIndex);
        const voxel = chunk.blocks.get(tile.dataIndex);
        
        // Should have no invisible faces
        expect(voxel.flags).toBe(0);
        expect(voxel.flags & FRONT_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & RIGHT_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & BACK_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & LEFT_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & TOP_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & BOTTOM_FACE_INVISIBLE).toBe(0);
    });
    
    it('should correctly identify partially covered voxels', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create two adjacent voxels - each should have some faces covered
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
            { position: [2, 1, 1], type: 1, flags: 0, damage: 0, temp: 0 },
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
        
        // First voxel should have right face invisible (RIGHT_FACE_INVISIBLE flag set)
        expect(voxel1.flags & RIGHT_FACE_INVISIBLE).toBe(RIGHT_FACE_INVISIBLE);
        expect(voxel1.flags & LEFT_FACE_INVISIBLE).toBe(0);
        
        // Second voxel should have left face invisible (LEFT_FACE_INVISIBLE flag set)
        expect(voxel2.flags & LEFT_FACE_INVISIBLE).toBe(LEFT_FACE_INVISIBLE);
        expect(voxel2.flags & RIGHT_FACE_INVISIBLE).toBe(0);
    });
    
    it('should work correctly when other flags are present', () => {
        const chunk = createStaticVoxelChunk(3);
        
        // Create a single voxel at (1, 1, 1) with additional flags
        const voxels: Array<Omit<StaticVoxel, "height"> & { position: Vec3 }> = [
            { position: [1, 1, 1], type: 1, flags: 0b1000000, damage: 0, temp: 0 }, // Has additional flag
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        calculateInvisibleFlags(chunk);
        
        // Find the voxel
        const tileIndex = 1 * 3 + 1; // y=1, x=1
        const tile = chunk.tiles.get(tileIndex);
        const voxel = chunk.blocks.get(tile.dataIndex);
        
        // Should have no invisible faces plus the original additional flag
        const expectedFlags = 0b1000000;
        expect(voxel.flags).toBe(expectedFlags);
        
        // Face invisibility mask should still work correctly
        expect(voxel.flags & ALL_FACES_INVISIBLE_MASK).toBe(0);
        
        // Individual face flags should still work
        expect(voxel.flags & FRONT_FACE_INVISIBLE).toBe(0);
        expect(voxel.flags & RIGHT_FACE_INVISIBLE).toBe(0);
    });
}); 