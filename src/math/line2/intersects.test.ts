import { describe, it, expect } from 'vitest';
import { intersects } from './intersects';
import { Line2 } from './line2';

describe('intersects', () => {
    it('should return true for intersecting lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [0, 2],
            b: [2, 0]
        };
        expect(intersects(line1, line2)).toBe(true);
    });

    it('should return false for parallel lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [0, 1],
            b: [2, 3]
        };
        expect(intersects(line1, line2)).toBe(false);
    });

    it('should return false for non-intersecting lines', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [3, 0],
            b: [5, 2]
        };
        expect(intersects(line1, line2)).toBe(false);
    });

    it('should return true for lines that intersect at endpoints', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [2, 2],
            b: [4, 4]
        };
        expect(intersects(line1, line2)).toBe(true);
    });

    it('should return false for collinear lines that do not overlap', () => {
        const line1: Line2 = {
            a: [0, 0],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [3, 3],
            b: [5, 5]
        };
        expect(intersects(line1, line2)).toBe(false);
    });

    it('should handle vertical and horizontal lines', () => {
        const vertical: Line2 = {
            a: [1, 0],
            b: [1, 2]
        };
        const horizontal: Line2 = {
            a: [0, 1],
            b: [2, 1]
        };
        expect(intersects(vertical, horizontal)).toBe(true);
    });

    it('should handle lines with negative coordinates', () => {
        const line1: Line2 = {
            a: [-2, -2],
            b: [2, 2]
        };
        const line2: Line2 = {
            a: [-2, 2],
            b: [2, -2]
        };
        expect(intersects(line1, line2)).toBe(true);
    });
}); 