import { describe, it, expect } from 'vitest';
import { interpolate } from './interpolate.js';
import { Line3 } from './line3.js';

describe('interpolate', () => {
    it('should interpolate at alpha = 0', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = interpolate(line, 0);
        expect(result).toEqual([0, 0, 0]);
    });

    it('should interpolate at alpha = 1', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = interpolate(line, 1);
        expect(result).toEqual([2, 4, 6]);
    });

    it('should interpolate at alpha = 0.5', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [2, 4, 6]
        };
        const result = interpolate(line, 0.5);
        expect(result).toEqual([1, 2, 3]);
    });

    it('should interpolate with negative coordinates', () => {
        const line: Line3 = {
            a: [-2, -4, -6],
            b: [2, 4, 6]
        };
        const result = interpolate(line, 0.5);
        expect(result).toEqual([0, 0, 0]);
    });

    it('should interpolate with fractional alpha', () => {
        const line: Line3 = {
            a: [0, 0, 0],
            b: [10, 20, 30]
        };
        const result = interpolate(line, 0.3);
        expect(result).toEqual([3, 6, 9]);
    });
}); 