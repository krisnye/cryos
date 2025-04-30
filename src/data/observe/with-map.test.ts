import { describe, it, expect } from 'vitest';
import { withMap } from './with-map';
import type { Observe } from './observe';
import { createObservableState } from './create-observable-state';

describe('withMap', () => {
    it('should transform values using the provided map function', () => {
        const [source, setSource] = createObservableState<number>(1);
        const mapFn = (value: number) => value * 2;
        
        const mapped = withMap(source, mapFn);
        const observedValues: number[] = [];
        const unsubscribe = mapped(value => observedValues.push(value));

        // Initial value should be transformed
        expect(observedValues).toEqual([2]);

        // Updates should be transformed
        setSource(2);
        expect(observedValues).toEqual([2, 4]);

        unsubscribe();
    });

    it('should handle type transformations', () => {
        type SourceType = { value: number };
        type TargetType = { doubled: number };

        const [source, setSource] = createObservableState<SourceType>({ value: 1 });
        const mapFn = (value: SourceType): TargetType => ({ doubled: value.value * 2 });
        
        const mapped = withMap(source, mapFn);
        const observedValues: TargetType[] = [];
        const unsubscribe = mapped(value => observedValues.push(value));

        // Initial value should be transformed
        expect(observedValues).toEqual([{ doubled: 2 }]);

        // Updates should be transformed
        setSource({ value: 3 });
        expect(observedValues).toEqual([{ doubled: 2 }, { doubled: 6 }]);

        unsubscribe();
    });

    it('should handle unsubscription correctly', () => {
        const [source, setSource] = createObservableState<number>(1);
        const mapFn = (value: number) => value * 2;
        
        const mapped = withMap(source, mapFn);
        const observedValues: number[] = [];
        const unsubscribe = mapped(value => observedValues.push(value));

        // Initial value
        expect(observedValues).toEqual([2]);

        // Unsubscribe
        unsubscribe();

        // Updates should not be observed
        setSource(2);
        expect(observedValues).toEqual([2]);
    });

    it('should handle async updates', async () => {
        const [source, setSource] = createObservableState<number>(1);
        const mapFn = (value: number) => value * 2;
        
        const mapped = withMap(source, mapFn);
        const observedValues: number[] = [];
        const unsubscribe = mapped(value => observedValues.push(value));

        // Initial value
        expect(observedValues).toEqual([2]);

        // Async updates
        setTimeout(() => setSource(2), 0);
        setTimeout(() => setSource(3), 0);

        // Wait for all updates
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(observedValues).toEqual([2, 4, 6]);

        unsubscribe();
    });

    it('should handle complex transformations', () => {
        type SourceType = { values: number[] };
        type TargetType = { sum: number; average: number };

        const [source, setSource] = createObservableState<SourceType>({ values: [1, 2, 3] });
        const mapFn = (value: SourceType): TargetType => {
            const sum = value.values.reduce((a, b) => a + b, 0);
            return {
                sum,
                average: sum / value.values.length
            };
        };
        
        const mapped = withMap(source, mapFn);
        const observedValues: TargetType[] = [];
        const unsubscribe = mapped(value => observedValues.push(value));

        // Initial value should be transformed
        expect(observedValues).toEqual([{ sum: 6, average: 2 }]);

        // Updates should be transformed
        setSource({ values: [4, 5, 6] });
        expect(observedValues).toEqual([
            { sum: 6, average: 2 },
            { sum: 15, average: 5 }
        ]);

        unsubscribe();
    });
}); 