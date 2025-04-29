import { describe, it, expect, vi } from 'vitest';
import { fromProperties } from './from-properties';
import type { Observe } from './observe';
import { createObservableState } from './create-observable-state';

describe('fromProperties', () => {
    it('should combine multiple observables into a single observable', async () => {
        const [alpha, setAlpha] = createObservableState<number>(1);
        const [beta, setBeta] = createObservableState<string>("two");

        const combined = fromProperties({ alpha, beta });
        const observedValues: { alpha: number; beta: string }[] = [];
        const unsubscribe = combined(value => observedValues.push(value));

        // Initial values should be emitted
        expect(observedValues).toEqual([{ alpha: 1, beta: "two" }]);

        // Update one value
        setAlpha(2);
        expect(observedValues).toEqual([
            { alpha: 1, beta: "two" },
            { alpha: 2, beta: "two" }
        ]);

        // Update both values
        setAlpha(3);
        setBeta("three");
        expect(observedValues).toEqual([
            { alpha: 1, beta: "two" },
            { alpha: 2, beta: "two" },
            { alpha: 3, beta: "two" },
            { alpha: 3, beta: "three" }
        ]);

        unsubscribe();
    });

    it('should handle unsubscription correctly', () => {
        const [alpha, setAlpha] = createObservableState<number>(1);
        const [beta, setBeta] = createObservableState<string>("two");

        const combined = fromProperties({ alpha, beta });
        const observedValues: { alpha: number; beta: string }[] = [];
        const unsubscribe = combined(value => observedValues.push(value));

        // Initial values
        expect(observedValues).toEqual([{ alpha: 1, beta: "two" }]);

        // Unsubscribe
        unsubscribe();

        // Updates should not be observed
        setAlpha(2);
        setBeta("three");
        expect(observedValues).toEqual([{ alpha: 1, beta: "two" }]);
    });

    it('should handle empty properties object', () => {
        const combined = fromProperties({});
        const observedValues: {}[] = [];
        const unsubscribe = combined(value => observedValues.push(value));

        // Should emit empty object immediately
        expect(observedValues).toEqual([{}]);

        unsubscribe();
    });

    it('should handle async updates', async () => {
        const [alpha, setAlpha] = createObservableState<number>(1);
        const [beta, setBeta] = createObservableState<string>("two");

        const combined = fromProperties({ alpha, beta });
        const observedValues: { alpha: number; beta: string }[] = [];
        const unsubscribe = combined(value => observedValues.push(value));

        // Initial values
        expect(observedValues).toEqual([{ alpha: 1, beta: "two" }]);

        // Async updates
        setTimeout(() => setAlpha(2), 0);
        setTimeout(() => setBeta("three"), 0);

        // Wait for all updates
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(observedValues).toEqual([
            { alpha: 1, beta: "two" },
            { alpha: 2, beta: "two" },
            { alpha: 2, beta: "three" }
        ]);

        unsubscribe();
    });

    it('should handle complex nested objects', () => {
        type AlphaType = { x: number; y: number };
        type BetaType = { name: string; values: number[] };

        const [alpha, setAlpha] = createObservableState<AlphaType>({ x: 1, y: 2 });
        const [beta, setBeta] = createObservableState<BetaType>({ name: "test", values: [1, 2, 3] });

        const combined = fromProperties({ alpha, beta });
        const observedValues: { alpha: AlphaType; beta: BetaType }[] = [];
        const unsubscribe = combined(value => observedValues.push(value));

        // Initial values
        expect(observedValues).toEqual([
            { alpha: { x: 1, y: 2 }, beta: { name: "test", values: [1, 2, 3] } }
        ]);

        // Update nested values
        setAlpha({ x: 3, y: 4 });
        setBeta({ name: "updated", values: [4, 5, 6] });

        expect(observedValues).toEqual([
            { alpha: { x: 1, y: 2 }, beta: { name: "test", values: [1, 2, 3] } },
            { alpha: { x: 3, y: 4 }, beta: { name: "test", values: [1, 2, 3] } },
            { alpha: { x: 3, y: 4 }, beta: { name: "updated", values: [4, 5, 6] } }
        ]);

        unsubscribe();
    });
}); 