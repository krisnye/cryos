import { describe, it, expect } from 'vitest';
import { Indexed, ReadonlyIndexed } from './indexed';
import { createIndexed } from './create-indexed';

describe('Indexed', () => {
    it('should allow arrays to be typed as Indexed<T>', () => {
        const arr: Indexed<number> = createIndexed(new Set([1, 2, 3]));
        expect(arr.length).toBe(3);
        expect(arr.get(0)).toBe(1);
        expect(arr.get(1)).toBe(2);
        expect(arr.get(2)).toBe(3);
    });

    it('should allow arrays to be typed as ReadonlyIndexed<T>', () => {
        const arr: ReadonlyIndexed<number> = createIndexed([1, 2, 3]);
        expect(arr.length).toBe(3);
        expect(arr.get(0)).toBe(1);
        expect(arr.get(1)).toBe(2);
        expect(arr.get(2)).toBe(3);
    });

    it('should allow setting values through the set method', () => {
        const arr: Indexed<number> = createIndexed([1, 2, 3]);
        arr.set(1, 42);
        expect(arr.get(1)).toBe(42);
    });

    it('should maintain array length property behavior', () => {
        const arr: Indexed<number> = createIndexed([1, 2, 3]);
        expect(arr.length).toBe(3);
        
        // Test length modification
        arr.length = 2;
        expect(arr.length).toBe(2);
        expect(arr.get(0)).toBe(1);
        expect(arr.get(1)).toBe(2);
        
        // Test length extension
        arr.length = 4;
        expect(arr.length).toBe(4);
        expect(arr.get(0)).toBe(1);
        expect(arr.get(1)).toBe(2);
        expect(arr.get(2)).toBeUndefined();
        expect(arr.get(3)).toBeUndefined();
    });

    it('should work with different types', () => {
        const stringArr: Indexed<string> = createIndexed(['a', 'b', 'c']);
        expect(stringArr.get(0)).toBe('a');
        stringArr.set(1, 'x');
        expect(stringArr.get(1)).toBe('x');

        const objArr: Indexed<{ value: number }> = createIndexed([{ value: 1 }, { value: 2 }])  ;
        expect(objArr.get(0)).toEqual({ value: 1 });
        objArr.set(1, { value: 42 });
        expect(objArr.get(1)).toEqual({ value: 42 });
    });

    it('should handle out of bounds access', () => {
        const arr: Indexed<number> = createIndexed([1, 2, 3]);
        expect(arr.get(-1)).toBeUndefined();
        expect(arr.get(3)).toBeUndefined();
        
        // Setting out of bounds should extend the array
        arr.set(5, 42);
        expect(arr.length).toBe(6);
        expect(arr.get(5)).toBe(42);
        expect(arr.get(3)).toBeUndefined();
        expect(arr.get(4)).toBeUndefined();
    });
});
