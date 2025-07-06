import { describe, it, expect } from 'vitest';
import { createRandomStaticVoxelChunk } from './create-random-static-voxel-chunk.js';
import { Vec2 } from 'math/index.js';

describe('createRandomStaticVoxelChunk', () => {
    it('should generate deterministic chunks for the same position', () => {
        const size = 4;
        const position: Vec2 = [1, 2];
        
        // Generate the same chunk twice
        const chunk1 = createRandomStaticVoxelChunk(size, position);
        const chunk2 = createRandomStaticVoxelChunk(size, position);
        
        // Verify they are identical
        expect(chunk1.size).toBe(chunk2.size);
        expect(chunk1.size).toBe(size);
        
        // Check all tiles are identical
        for (let i = 0; i < size * size; i++) {
            const tile1 = chunk1.tiles.get(i);
            const tile2 = chunk2.tiles.get(i);
            
            expect(tile1.height).toBe(tile2.height);
            expect(tile1.dataLength).toBe(tile2.dataLength);
            expect(tile1.dataIndex).toBe(tile2.dataIndex);
        }
        
        // Check all blocks are identical
        const totalBlocks1 = chunk1.blocks.size;
        const totalBlocks2 = chunk2.blocks.size;
        expect(totalBlocks1).toBe(totalBlocks2);
        
        for (let i = 0; i < totalBlocks1; i++) {
            const block1 = chunk1.blocks.get(i);
            const block2 = chunk2.blocks.get(i);
            
            expect(block1.type).toBe(block2.type);
            expect(block1.flags).toBe(block2.flags);
            expect(block1.damage).toBe(block2.damage);
            expect(block1.temp).toBe(block2.temp);
            expect(block1.height).toBe(block2.height);
        }
    });

    it('should generate different chunks for different positions', () => {
        const size = 4;
        const position1: Vec2 = [0, 0];
        const position2: Vec2 = [1, 0];
        
        const chunk1 = createRandomStaticVoxelChunk(size, position1);
        const chunk2 = createRandomStaticVoxelChunk(size, position2);
        
        // They should have the same size but different content
        expect(chunk1.size).toBe(chunk2.size);
        
        // At least some tiles should be different
        let hasDifferentTiles = false;
        for (let i = 0; i < size * size; i++) {
            const tile1 = chunk1.tiles.get(i);
            const tile2 = chunk2.tiles.get(i);
            
            if (tile1.height !== tile2.height || tile1.dataLength !== tile2.dataLength) {
                hasDifferentTiles = true;
                break;
            }
        }
        
        expect(hasDifferentTiles).toBe(true);
    });

    it('should create seamless terrain between adjacent chunks', () => {
        const size = 4;
        const chunk1 = createRandomStaticVoxelChunk(size, [0, 0]);
        const chunk2 = createRandomStaticVoxelChunk(size, [1, 0]); // Adjacent to the right
        
        // Check that the right edge of chunk1 matches the left edge of chunk2
        // For each Y coordinate, the height at (size-1, y) in chunk1 should be similar to (0, y) in chunk2
        for (let y = 0; y < size; y++) {
            const tile1Index = y * size + (size - 1); // Right edge of chunk1
            const tile2Index = y * size + 0; // Left edge of chunk2
            
            const tile1 = chunk1.tiles.get(tile1Index);
            const tile2 = chunk2.tiles.get(tile2Index);
            
            // The heights should be similar (within a reasonable range due to noise continuity)
            const heightDiff = Math.abs(tile1.height - tile2.height);
            expect(heightDiff).toBeLessThanOrEqual(3); // Allow some variation due to noise
        }
    });

    it('should create seamless terrain between vertically adjacent chunks', () => {
        const size = 4;
        const chunk1 = createRandomStaticVoxelChunk(size, [0, 0]);
        const chunk2 = createRandomStaticVoxelChunk(size, [0, 1]); // Adjacent below
        
        // Check that the bottom edge of chunk1 matches the top edge of chunk2
        // For each X coordinate, the height at (x, size-1) in chunk1 should be similar to (x, 0) in chunk2
        for (let x = 0; x < size; x++) {
            const tile1Index = (size - 1) * size + x; // Bottom edge of chunk1
            const tile2Index = 0 * size + x; // Top edge of chunk2
            
            const tile1 = chunk1.tiles.get(tile1Index);
            const tile2 = chunk2.tiles.get(tile2Index);
            
            // The heights should be similar (within a reasonable range due to noise continuity)
            const heightDiff = Math.abs(tile1.height - tile2.height);
            expect(heightDiff).toBeLessThanOrEqual(3); // Allow some variation due to noise
        }
    });

    it('should generate reasonable terrain heights', () => {
        const size = 4;
        const position: Vec2 = [0, 0];
        const chunk = createRandomStaticVoxelChunk(size, position);
        
        // Check that all heights are within reasonable bounds
        // Base height is 10, height range is 8, so heights should be roughly 2-18
        for (let i = 0; i < size * size; i++) {
            const tile = chunk.tiles.get(i);
            
            if (tile.dataLength > 0) {
                // If there are voxels, height should be reasonable
                expect(tile.height).toBeGreaterThanOrEqual(0);
                expect(tile.height).toBeLessThanOrEqual(25); // Allow some buffer above expected range
            } else {
                // If no voxels, height should be 0
                expect(tile.height).toBe(0);
            }
        }
    });

    it('should only create surface voxels (no buried voxels)', () => {
        const size = 4;
        const position: Vec2 = [0, 0];
        const chunk = createRandomStaticVoxelChunk(size, position);
        
        // Check that each tile has at most 1 voxel (surface only)
        for (let i = 0; i < size * size; i++) {
            const tile = chunk.tiles.get(i);
            expect(tile.dataLength).toBeLessThanOrEqual(1);
            
            // If there's a voxel, it should be at the surface height
            if (tile.dataLength === 1) {
                const blockIndex = tile.dataIndex;
                const block = chunk.blocks.get(blockIndex);
                expect(block.height).toBe(tile.height);
            }
        }
    });

    it('should handle different chunk sizes', () => {
        const position: Vec2 = [0, 0];
        
        const chunk4 = createRandomStaticVoxelChunk(4, position);
        const chunk8 = createRandomStaticVoxelChunk(8, position);
        const chunk16 = createRandomStaticVoxelChunk(16, position);
        
        expect(chunk4.size).toBe(4);
        expect(chunk8.size).toBe(8);
        expect(chunk16.size).toBe(16);
        
        // All chunks should have the correct number of tiles
        expect(chunk4.tiles.size).toBe(16); // 4 * 4
        expect(chunk8.tiles.size).toBe(64); // 8 * 8
        expect(chunk16.tiles.size).toBe(256); // 16 * 16
    });

    it('should not have large discontinuities between adjacent size-8 chunks', () => {
        const size = 8;
        const chunk1 = createRandomStaticVoxelChunk(size, [0, 0]);
        const chunk2 = createRandomStaticVoxelChunk(size, [1, 0]); // Adjacent to the right

        let maxDiff = 0;
        for (let y = 0; y < size; y++) {
            const tile1Index = y * size + (size - 1); // Right edge of chunk1
            const tile2Index = y * size + 0; // Left edge of chunk2

            const tile1 = chunk1.tiles.get(tile1Index);
            const tile2 = chunk2.tiles.get(tile2Index);

            const heightDiff = Math.abs(tile1.height - tile2.height);
            if (heightDiff > maxDiff) maxDiff = heightDiff;
            // Print for debugging if discontinuity is large
            if (heightDiff > 3) {
                // eslint-disable-next-line no-console
                console.log(`Discontinuity at y=${y}: chunk1.height=${tile1.height}, chunk2.height=${tile2.height}, diff=${heightDiff}`);
            }
            expect(heightDiff).toBeLessThanOrEqual(3);
        }
        // eslint-disable-next-line no-console
        console.log('Max discontinuity between adjacent size-8 chunks:', maxDiff);
    });

    it('should not have large discontinuities between three adjacent size-16 chunks', () => {
        const size = 16;
        const chunkA = createRandomStaticVoxelChunk(size, [0, 0]);
        const chunkB = createRandomStaticVoxelChunk(size, [1, 0]); // Adjacent to the right of A
        const chunkC = createRandomStaticVoxelChunk(size, [2, 0]); // Adjacent to the right of B

        let maxDiffAB = 0;
        let maxDiffBC = 0;
        for (let y = 0; y < size; y++) {
            // A vs B
            const tileA = chunkA.tiles.get(y * size + (size - 1)); // Right edge of A
            const tileB = chunkB.tiles.get(y * size + 0); // Left edge of B
            const diffAB = Math.abs(tileA.height - tileB.height);
            if (diffAB > maxDiffAB) maxDiffAB = diffAB;
            if (diffAB > 3) {
                // eslint-disable-next-line no-console
                console.log(`Discontinuity A-B at y=${y}: A.height=${tileA.height}, B.height=${tileB.height}, diff=${diffAB}`);
            }
            expect(diffAB).toBeLessThanOrEqual(3);

            // B vs C
            const tileB2 = chunkB.tiles.get(y * size + (size - 1)); // Right edge of B
            const tileC = chunkC.tiles.get(y * size + 0); // Left edge of C
            const diffBC = Math.abs(tileB2.height - tileC.height);
            if (diffBC > maxDiffBC) maxDiffBC = diffBC;
            if (diffBC > 3) {
                // eslint-disable-next-line no-console
                console.log(`Discontinuity B-C at y=${y}: B.height=${tileB2.height}, C.height=${tileC.height}, diff=${diffBC}`);
            }
            expect(diffBC).toBeLessThanOrEqual(3);
        }
        // eslint-disable-next-line no-console
        console.log('Max discontinuity between A-B:', maxDiffAB);
        // eslint-disable-next-line no-console
        console.log('Max discontinuity between B-C:', maxDiffBC);
    });
}); 