import { describe, it, expect } from 'vitest';
import {
    getVisible,
    getBond,
    getDamage,
    getTemp,
    getType,
    setVisible,
    setBond,
    setDamage,
    setTemp,
    setType,
    StaticVoxelUnbondX,
    StaticVoxelUnbondY,
    StaticVoxelUnbondZ,
    toDebugStaticVoxel,
} from './static-voxel';

describe('StaticVoxel', () => {
    describe('visibility', () => {
        it('should read and write visibility correctly', () => {
            let voxel = 0;
            
            // Test setting to visible
            voxel = setVisible(voxel, true);
            expect(getVisible(voxel)).toBe(true);
            
            // Test setting to invisible
            voxel = setVisible(voxel, false);
            expect(getVisible(voxel)).toBe(false);
            
            // Test that visibility doesn't affect other fields
            voxel = setType(voxel, 123);
            voxel = setVisible(voxel, true);
            expect(getType(voxel)).toBe(123);
        });
    });

    describe('bonds', () => {
        it('should read and write X bond correctly', () => {
            let voxel = 0;
            
            voxel = setBond(voxel, StaticVoxelUnbondX, true);
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
            
            voxel = setBond(voxel, StaticVoxelUnbondX, false);
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(false);
        });

        it('should read and write Y bond correctly', () => {
            let voxel = 0;
            
            voxel = setBond(voxel, StaticVoxelUnbondY, true);
            expect(getBond(voxel, StaticVoxelUnbondY)).toBe(true);
            
            voxel = setBond(voxel, StaticVoxelUnbondY, false);
            expect(getBond(voxel, StaticVoxelUnbondY)).toBe(false);
        });

        it('should read and write Z bond correctly', () => {
            let voxel = 0;
            
            voxel = setBond(voxel, StaticVoxelUnbondZ, true);
            expect(getBond(voxel, StaticVoxelUnbondZ)).toBe(true);
            
            voxel = setBond(voxel, StaticVoxelUnbondZ, false);
            expect(getBond(voxel, StaticVoxelUnbondZ)).toBe(false);
        });

        it('should handle multiple bonds independently', () => {
            let voxel = 0;
            
            // Set all bonds
            voxel = setBond(voxel, StaticVoxelUnbondX, true);
            voxel = setBond(voxel, StaticVoxelUnbondY, true);
            voxel = setBond(voxel, StaticVoxelUnbondZ, true);
            
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
            expect(getBond(voxel, StaticVoxelUnbondY)).toBe(true);
            expect(getBond(voxel, StaticVoxelUnbondZ)).toBe(true);
            
            // Clear one bond
            voxel = setBond(voxel, StaticVoxelUnbondY, false);
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
            expect(getBond(voxel, StaticVoxelUnbondY)).toBe(false);
            expect(getBond(voxel, StaticVoxelUnbondZ)).toBe(true);
        });
    });

    describe('damage', () => {
        it('should read and write damage correctly', () => {
            let voxel = 0;
            
            // Test max damage (4 bits = 15)
            voxel = setDamage(voxel, 15);
            expect(getDamage(voxel)).toBe(15);
            
            // Test zero damage
            voxel = setDamage(voxel, 0);
            expect(getDamage(voxel)).toBe(0);
            
            // Test intermediate value
            voxel = setDamage(voxel, 7);
            expect(getDamage(voxel)).toBe(7);
        });
    });

    describe('temperature', () => {
        it('should read and write temperature correctly', () => {
            let voxel = 0;
            
            // Test max temperature (13 bits = 8191)
            voxel = setTemp(voxel, 8191);
            expect(getTemp(voxel)).toBe(8191);
            
            // Test zero temperature
            voxel = setTemp(voxel, 0);
            expect(getTemp(voxel)).toBe(0);
            
            // Test intermediate value
            voxel = setTemp(voxel, 4095);
            expect(getTemp(voxel)).toBe(4095);
        });
    });

    describe('type', () => {
        it('should read and write type correctly', () => {
            let voxel = 0;

            voxel = setType(voxel, 1);
            expect(getType(voxel)).toBe(1);

            // Test max type (11 bits = 2047)
            voxel = setType(voxel, 1023);
            expect(getType(voxel)).toBe(1023);

            // Test max type (11 bits = 2047)
            voxel = setType(voxel, 512);
            expect(getType(voxel)).toBe(512);
        });
    });

    describe('field independence', () => {
        it('should maintain field independence when modifying different fields', () => {
            let voxel = 0;
            
            // Set all fields to non-zero values
            voxel = setVisible(voxel, true);
            voxel = setBond(voxel, StaticVoxelUnbondX, true);
            voxel = setDamage(voxel, 7);
            voxel = setTemp(voxel, 4095);
            voxel = setType(voxel, 1023);
            
            // Verify all fields
            expect(getVisible(voxel)).toBe(true);
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
            expect(getDamage(voxel)).toBe(7);
            expect(getTemp(voxel)).toBe(4095);
            expect(getType(voxel)).toBe(1023);
            
            // Modify one field and verify others remain unchanged
            voxel = setDamage(voxel, 3);
            expect(getVisible(voxel)).toBe(true);
            expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
            expect(getDamage(voxel)).toBe(3);
            expect(getTemp(voxel)).toBe(4095);
            expect(getType(voxel)).toBe(1023);
        });
    });

    describe('debug representation', () => {
        it('should provide correct debug representation', () => {
            let voxel = 0;
            
            // Set all fields
            voxel = setVisible(voxel, true);
            voxel = setBond(voxel, StaticVoxelUnbondX, true);
            voxel = setDamage(voxel, 7);
            voxel = setTemp(voxel, 4095);
            voxel = setType(voxel, 1023);
            
            const debug = toDebugStaticVoxel(voxel);
            expect(debug).toEqual({
                visible: true,
                bond: true,
                damage: 7,
                temp: 4095,
                type: 1023
            });
        });
    });

    it('should read and write all fields correctly', () => {
        let voxel = 0;
        
        // Set all fields to non-zero values
        voxel = setVisible(voxel, true);
        voxel = setBond(voxel, StaticVoxelUnbondX, true);
        voxel = setDamage(voxel, 7);
        voxel = setTemp(voxel, 4095);
        voxel = setType(voxel, 1023);
        
        // Verify all fields
        expect(getVisible(voxel)).toBe(true);
        expect(getBond(voxel, StaticVoxelUnbondX)).toBe(true);
        expect(getDamage(voxel)).toBe(7);
        expect(getTemp(voxel)).toBe(4095);
        expect(getType(voxel)).toBe(1023);
        
        // Verify debug representation
        expect(toDebugStaticVoxel(voxel)).toEqual({
            visible: true,
            bond: true,
            damage: 7,
            temp: 4095,
            type: 1023
        });
    });

    it('should maintain field independence', () => {
        let voxel = 0;
        
        // Set initial state
        voxel = setVisible(voxel, true);
        voxel = setDamage(voxel, 7);
        voxel = setType(voxel, 1023);
        
        // Modify one field
        voxel = setDamage(voxel, 3);
        
        // Verify other fields remain unchanged
        expect(getVisible(voxel)).toBe(true);
        expect(getType(voxel)).toBe(1023);
        expect(getDamage(voxel)).toBe(3);
    });
});
