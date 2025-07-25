import { describe, it, expect } from 'vitest';
import { createStructBuffer } from "@adobe/data/typed-buffer";
import { Schema, U32Schema, F32Schema } from "@adobe/data/schema";
import { updateStructureMapFromPositionArray } from './from-position-array.js';
import { GenericChunk, StructureMapTileSchema } from './generic-chunk.js';

// Test data type
type TestVoxel = {
    type: number;
    color: number;
};

// Test voxel schema
const TestVoxelSchema = {
    type: "object",
    properties: {
        type: U32Schema,
        color: U32Schema,
        height: F32Schema,
    },
    required: ["type", "color", "height"],
    additionalProperties: false,
} as const satisfies Schema;

// Helper to create a test chunk
function createTestChunk(size: number): GenericChunk<TestVoxel & { height: number }> {
    return {
        size,
        tiles: createStructBuffer(StructureMapTileSchema, size * size),
        blocks: createStructBuffer(TestVoxelSchema, size * size),
    };
}

describe('updateStructureMapFromPositionArray', () => {
    it('should sort voxels by height within columns', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [0, 0, 10], type: 1, color: 0x808080 },
            { position: [0, 0, 5], type: 2, color: 0x8B4513 },
            { position: [0, 0, 15], type: 3, color: 0x228B22 }
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        
        // Check the column has correct length and height
        const tile = chunk.tiles.get(0);
        expect(tile.dataLength).toBe(3);
        expect(tile.height).toBe(15); // Highest Z coordinate
        
        // Check blocks are sorted by height (ascending)
        const block0 = chunk.blocks.get(0);
        const block1 = chunk.blocks.get(1);
        const block2 = chunk.blocks.get(2);
        
        expect(block0.height).toBe(5);   // lowest
        expect(block0.type).toBe(2);
        expect(block1.height).toBe(10);  // middle
        expect(block1.type).toBe(1);
        expect(block2.height).toBe(15);  // highest
        expect(block2.type).toBe(3);
    });

    it('should handle multiple columns', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [0, 0, 5], type: 1, color: 0x808080 },
            { position: [1, 0, 3], type: 2, color: 0x8B4513 },
            { position: [0, 1, 7], type: 3, color: 0x228B22 },
            { position: [1, 1, 2], type: 4, color: 0xF4A460 }
        ];
        
        updateStructureMapFromPositionArray(voxels, chunk);
        
        // Check tile (0,0) - y * size + x = 0 * 2 + 0 = 0
        const tile00 = chunk.tiles.get(0);
        expect(tile00.dataLength).toBe(1);
        expect(tile00.height).toBe(5);
        expect(tile00.dataIndex).toBe(0);
        
        // Check tile (1,0) - y * size + x = 0 * 2 + 1 = 1
        const tile10 = chunk.tiles.get(1);
        expect(tile10.dataLength).toBe(1);
        expect(tile10.height).toBe(3);
        expect(tile10.dataIndex).toBe(1);
        
        // Check tile (0,1) - y * size + x = 1 * 2 + 0 = 2
        const tile01 = chunk.tiles.get(2);
        expect(tile01.dataLength).toBe(1);
        expect(tile01.height).toBe(7);
        expect(tile01.dataIndex).toBe(2);
        
        // Check tile (1,1) - y * size + x = 1 * 2 + 1 = 3
        const tile11 = chunk.tiles.get(3);
        expect(tile11.dataLength).toBe(1);
        expect(tile11.height).toBe(2);
        expect(tile11.dataIndex).toBe(3);
        
        // Verify block data
        expect(chunk.blocks.get(0).type).toBe(1);
        expect(chunk.blocks.get(1).type).toBe(2);
        expect(chunk.blocks.get(2).type).toBe(3);
        expect(chunk.blocks.get(3).type).toBe(4);
    });

    it('should throw error for out of bounds X coordinate', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [2, 0, 5], type: 1, color: 0x808080 }
        ];
        
        expect(() => {
            updateStructureMapFromPositionArray(voxels, chunk);
        }).toThrow('Position [2,0,5] is out of bounds for chunk size 2');
    });

    it('should throw error for out of bounds Y coordinate', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [0, 2, 5], type: 1, color: 0x808080 }
        ];
        
        expect(() => {
            updateStructureMapFromPositionArray(voxels, chunk);
        }).toThrow('Position [0,2,5] is out of bounds for chunk size 2');
    });

    it('should throw error for negative X coordinate', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [-1, 0, 5], type: 1, color: 0x808080 }
        ];
        
        expect(() => {
            updateStructureMapFromPositionArray(voxels, chunk);
        }).toThrow('Position [-1,0,5] is out of bounds for chunk size 2');
    });

    it('should throw error for negative Y coordinate', () => {
        const chunk = createTestChunk(2);
        const voxels: (TestVoxel & { position: [number, number, number] })[] = [
            { position: [0, -1, 5], type: 1, color: 0x808080 }
        ];
        
        expect(() => {
            updateStructureMapFromPositionArray(voxels, chunk);
        }).toThrow('Position [0,-1,5] is out of bounds for chunk size 2');
    });
}); 