import { describe, it, expect } from 'vitest';
import { deepAssign } from './deep-assign.js';

describe('deepAssign', () => {
    it('should merge flat objects by mutating target', () => {
        const target = { a: 1 };
        const source = { b: 2 };
        const result = deepAssign(target, source);
        expect(result).toEqual({ a: 1, b: 2 });
        // Verify target was modified
        expect(target).toEqual({ a: 1, b: 2 });
        // Verify result is the same object as target
        expect(result).toBe(target);
        // Verify source wasn't modified
        expect(source).toEqual({ b: 2 });
    });

    it('should deeply merge nested objects by mutating target', () => {
        const target = {
            a: { x: 1, y: 2 },
            b: { z: 3 }
        };
        const source = {
            a: { z: 3, w: 4 },
            b: { q: 5 }
        };
        const result = deepAssign(target, source);
        const expected = {
            a: { x: 1, y: 2, z: 3, w: 4 },
            b: { z: 3, q: 5 }
        };
        expect(result).toEqual(expected);
        // Verify target was modified
        expect(target).toEqual(expected);
        // Verify nested objects are the same instances
        expect(result.a).toBe(target.a);
        expect(result.b).toBe(target.b);
    });

    it('should deeply merge nested objects by mutating target', () => {
        const target = {
            a: [1, 2, 3],
            b: { z: 3 }
        };
        const source = {
            a: { z: 3, w: 4 },
            b: { q: 5 }
        };
        const result = deepAssign(target, source);
        const expected = {
            a: Object.assign([1, 2, 3], { z: 3, w: 4 }),
            b: { z: 3, q: 5 }
        };
        expect(result).toEqual(expected);
        // Verify target was modified
        expect(target).toEqual(expected);
        // Verify nested objects are the same instances
        expect(result.a).toBe(target.a);
        expect(result.b).toBe(target.b);
    });

    it('should throw when trying to overwrite primitive values', () => {
        const target = {
            a: 1,
            b: { x: 1 }
        };
        const source = {
            a: 2,
            b: { x: 2 }
        };
        expect(() => deepAssign(target, source)).toThrow('Cannot overwrite existing value at path "a"');
        // Verify target wasn't modified when error thrown
        expect(target).toEqual({
            a: 1,
            b: { x: 1 }
        });
    });

    it('should throw when trying to overwrite arrays', () => {
        const target = {
            a: [1, 2, 3],
            b: { x: 1 }
        };
        const source = {
            a: [4, 5, 6],
            b: { x: 2 }
        };
        expect(() => deepAssign(target, source)).toThrow('Cannot overwrite existing value at path "a"');
        // Verify target wasn't modified when error thrown
        expect(target).toEqual({
            a: [1, 2, 3],
            b: { x: 1 }
        });
    });

    it('should handle undefined values correctly', () => {
        const target = {
            a: undefined,
            b: { x: undefined }
        };
        const source = {
            a: 1,
            b: { x: 2, y: 3 }
        };
        const result = deepAssign(target, source);
        const expected = {
            a: 1,
            b: { x: 2, y: 3 }
        };
        expect(result).toEqual(expected);
        // Verify target was modified
        expect(target).toEqual(expected);
        // Verify result is the same object as target
        expect(result).toBe(target);
    });

    it('should handle deeply nested merges by mutating target', () => {
        const target = {
            a: {
                b: {
                    c: {
                        d: { x: 1 }
                    }
                }
            }
        };
        const source = {
            a: {
                b: {
                    c: {
                        d: { y: 2 }
                    }
                }
            }
        };
        const result = deepAssign(target, source);
        const expected = {
            a: {
                b: {
                    c: {
                        d: { x: 1, y: 2 }
                    }
                }
            }
        };
        expect(result).toEqual(expected);
        // Verify target was modified
        expect(target).toEqual(expected);
        // Verify all nested objects are the same instances
        expect(result.a).toBe(target.a);
        expect(result.a.b).toBe(target.a.b);
        expect(result.a.b.c).toBe(target.a.b.c);
        expect(result.a.b.c.d).toBe(target.a.b.c.d);
    });

    it('should handle empty objects', () => {
        const target = {};
        const source = { a: 1 };
        const result = deepAssign(target, source);
        expect(result).toEqual({ a: 1 });
        // Verify target was modified
        expect(target).toEqual({ a: 1 });
        // Verify result is the same object as target
        expect(result).toBe(target);
    });

}); 