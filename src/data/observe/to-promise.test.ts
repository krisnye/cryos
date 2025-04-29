import { describe, it, expect, vi } from 'vitest';
import { toPromise } from './to-promise';
import type { Observe } from './observe';

describe('toPromise', () => {
    it('should resolve only once with synchronous value', async () => {
        const mockObserver = vi.fn();
        const mockUnsubscribe = vi.fn();
        
        const observable: Observe<number> = (observer) => {
            observer(42);
            return mockUnsubscribe;
        };

        const promise = toPromise(observable);
        const result = await promise;

        expect(result).toBe(42);
        expect(mockObserver).not.toHaveBeenCalled();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should resolve only once with multiple synchronous values', async () => {
        const mockObserver = vi.fn();
        const mockUnsubscribe = vi.fn();
        
        const observable: Observe<number> = (observer) => {
            observer(42);
            observer(43);
            observer(44);
            return mockUnsubscribe;
        };

        const promise = toPromise(observable);
        const result = await promise;

        expect(result).toBe(42);
        expect(mockObserver).not.toHaveBeenCalled();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should resolve only once with asynchronous value', async () => {
        const mockObserver = vi.fn();
        const mockUnsubscribe = vi.fn();
        
        const observable: Observe<number> = (observer) => {
            setTimeout(() => observer(42), 0);
            return mockUnsubscribe;
        };

        const promise = toPromise(observable);
        const result = await promise;

        expect(result).toBe(42);
        expect(mockObserver).not.toHaveBeenCalled();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should resolve only once with multiple asynchronous values', async () => {
        const mockObserver = vi.fn();
        const mockUnsubscribe = vi.fn();
        
        const observable: Observe<number> = (observer) => {
            setTimeout(() => observer(42), 0);
            setTimeout(() => observer(43), 0);
            setTimeout(() => observer(44), 0);
            return mockUnsubscribe;
        };

        const promise = toPromise(observable);
        const result = await promise;

        expect(result).toBe(42);
        expect(mockObserver).not.toHaveBeenCalled();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
}); 