import { describe, it, expect } from 'vitest';
import { createTypedBuffer } from './create-typed-buffer';
import { createNumberBuffer } from './create-number-buffer';
import { createArrayBuffer } from './create-array-buffer';
import { createStructBuffer } from './create-struct-buffer';

describe('TypedBuffer copyWithin', () => {
    describe('NumberBuffer', () => {
        it('should copy elements within the same buffer', () => {
            const buffer = createNumberBuffer({
                schema: { type: 'number', precision: 1 },
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, i + 1);
            }
            
            // Copy elements 0-2 to position 2
            buffer.copyWithin(2, 0, 3);
            expect(buffer.get(0)).toBe(1);
            expect(buffer.get(1)).toBe(2);
            expect(buffer.get(2)).toBe(1);
            expect(buffer.get(3)).toBe(2);
            expect(buffer.get(4)).toBe(3);
        });

        it('should handle negative indices', () => {
            const buffer = createNumberBuffer({
                schema: { type: 'number', precision: 1 },
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, i + 1);
            }
            
            // Copy last 2 elements to start (from index -2 to end of array)
            buffer.copyWithin(0, -2, buffer.length);
            expect(buffer.get(0)).toBe(4);
            expect(buffer.get(1)).toBe(5);
            expect(buffer.get(2)).toBe(3);
            expect(buffer.get(3)).toBe(4);
            expect(buffer.get(4)).toBe(5);
        });

        it('should handle out of bounds indices', () => {
            const buffer = createNumberBuffer({
                schema: { type: 'number', precision: 1 },
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, i + 1);
            }
            
            // Copy with out of bounds target
            buffer.copyWithin(10, 0, 2);
            expect(buffer.get(0)).toBe(1);
            expect(buffer.get(1)).toBe(2);
            expect(buffer.get(2)).toBe(3);
            expect(buffer.get(3)).toBe(4);
            expect(buffer.get(4)).toBe(5);
        });
    });

    describe('ArrayBuffer', () => {
        it('should copy elements within the same buffer', () => {
            const buffer = createArrayBuffer<string>({ length: 5 });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, `value${i + 1}`);
            }
            
            // Copy elements 0-2 to position 2
            buffer.copyWithin(2, 0, 3);
            expect(buffer.get(0)).toBe('value1');
            expect(buffer.get(1)).toBe('value2');
            expect(buffer.get(2)).toBe('value1');
            expect(buffer.get(3)).toBe('value2');
            expect(buffer.get(4)).toBe('value3');
        });

        it('should handle negative indices', () => {
            const buffer = createArrayBuffer<string>({ length: 5 });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, `value${i + 1}`);
            }
            
            // Copy last 2 elements to start (from index -2 to end of array)
            buffer.copyWithin(0, -2, buffer.length);
            expect(buffer.get(0)).toBe('value4');
            expect(buffer.get(1)).toBe('value5');
            expect(buffer.get(2)).toBe('value3');
            expect(buffer.get(3)).toBe('value4');
            expect(buffer.get(4)).toBe('value5');
        });

        it('should handle out of bounds indices', () => {
            const buffer = createArrayBuffer<string>({ length: 5 });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, `value${i + 1}`);
            }
            
            // Copy with out of bounds target
            buffer.copyWithin(10, 0, 2);
            expect(buffer.get(0)).toBe('value1');
            expect(buffer.get(1)).toBe('value2');
            expect(buffer.get(2)).toBe('value3');
            expect(buffer.get(3)).toBe('value4');
            expect(buffer.get(4)).toBe('value5');
        });
    });

    describe('StructBuffer', () => {
        const vec2Schema = {
            type: 'object',
            properties: {
                x: { type: 'number', precision: 1 },
                y: { type: 'number', precision: 1 }
            }
        } as const;

        it('should copy elements within the same buffer', () => {
            const buffer = createStructBuffer({
                schema: vec2Schema,
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, { x: i + 1, y: i + 2 });
            }
            
            // Copy elements 0-2 to position 2
            buffer.copyWithin(2, 0, 3);
            expect(buffer.get(0)).toEqual({ x: 1, y: 2 });
            expect(buffer.get(1)).toEqual({ x: 2, y: 3 });
            expect(buffer.get(2)).toEqual({ x: 1, y: 2 });
            expect(buffer.get(3)).toEqual({ x: 2, y: 3 });
            expect(buffer.get(4)).toEqual({ x: 3, y: 4 });
        });

        it('should handle negative indices', () => {
            const buffer = createStructBuffer({
                schema: vec2Schema,
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, { x: i + 1, y: i + 2 });
            }
            
            // Copy last 2 elements to start (from index -2 to end of array)
            buffer.copyWithin(0, -2, buffer.length);
            expect(buffer.get(0)).toEqual({ x: 4, y: 5 });
            expect(buffer.get(1)).toEqual({ x: 5, y: 6 });
            expect(buffer.get(2)).toEqual({ x: 3, y: 4 });
            expect(buffer.get(3)).toEqual({ x: 4, y: 5 });
            expect(buffer.get(4)).toEqual({ x: 5, y: 6 });
        });

        it('should handle out of bounds indices', () => {
            const buffer = createStructBuffer({
                schema: vec2Schema,
                length: 5
            });
            
            // Initialize with values
            for (let i = 0; i < 5; i++) {
                buffer.set(i, { x: i + 1, y: i + 2 });
            }
            
            // Copy with out of bounds target
            buffer.copyWithin(10, 0, 2);
            expect(buffer.get(0)).toEqual({ x: 1, y: 2 });
            expect(buffer.get(1)).toEqual({ x: 2, y: 3 });
            expect(buffer.get(2)).toEqual({ x: 3, y: 4 });
            expect(buffer.get(3)).toEqual({ x: 4, y: 5 });
            expect(buffer.get(4)).toEqual({ x: 5, y: 6 });
        });
    });

    describe('createTypedBuffer', () => {
        it('should create appropriate buffer type and handle copyWithin', () => {
            // Test number buffer
            const numberBuffer = createTypedBuffer({
                schema: { type: 'number', precision: 1 }
            });
            numberBuffer.set(0, 1);
            numberBuffer.set(1, 2);
            numberBuffer.copyWithin(2, 0, 2);
            expect(numberBuffer.get(2)).toBe(1);
            expect(numberBuffer.get(3)).toBe(2);

            // Test array buffer
            const arrayBuffer = createTypedBuffer({
                schema: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 } as const
            });
            arrayBuffer.set(0, ['a', 'b']);
            arrayBuffer.set(1, ['c', 'd']);
            arrayBuffer.copyWithin(2, 0, 2);
            expect(arrayBuffer.get(2)).toEqual(['a', 'b']);
            expect(arrayBuffer.get(3)).toEqual(['c', 'd']);

            // Test struct buffer
            const structBuffer = createTypedBuffer({
                schema: {
                    type: 'object',
                    properties: {
                        x: { type: 'number', precision: 1 },
                        y: { type: 'number', precision: 1 }
                    }
                }
            });
            structBuffer.set(0, { x: 1, y: 2 });
            structBuffer.set(1, { x: 3, y: 4 });
            structBuffer.copyWithin(2, 0, 2);
            expect(structBuffer.get(2)).toEqual({ x: 1, y: 2 });
            expect(structBuffer.get(3)).toEqual({ x: 3, y: 4 });
        });
    });
}); 