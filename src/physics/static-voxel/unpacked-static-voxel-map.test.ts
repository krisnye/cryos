import { describe, it, expect } from 'vitest';
import { createUnpackedStaticVoxelMap, packStaticVoxelMap, setVoxel, unpackStaticVoxelMap } from './unpacked-static-voxel-map';
import { setType } from './static-voxel';

describe('UnpackedStaticVoxelMap', () => {
    it('should create a 2x2 voxel map with empty columns', () => {
        const map = createUnpackedStaticVoxelMap(2);
        
        // Verify map properties
        expect(map.size).toBe(2);
        expect(map.columns.length).toBe(4); // 2x2 = 4 columns
        
        // Verify all columns are empty arrays
        map.columns.forEach(column => {
            expect(Array.isArray(column)).toBe(true);
            expect(column.length).toBe(0);
        });
        
        setVoxel(map, 0, 0, 0, setType(0, 1));
        setVoxel(map, 1, 0, 1, setType(0, 2));
        setVoxel(map, 1, 0, 3, setType(0, 2));

        const packed = packStaticVoxelMap(map);
        const unpacked = unpackStaticVoxelMap(packed);
        const repacked = packStaticVoxelMap(unpacked);
        expect(repacked).toEqual(packed);
    });
});
