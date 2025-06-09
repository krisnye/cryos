import { describe, it, expect } from 'vitest';
import { toposort } from './toposort';

describe('toposort', () => {
    it('should sort nodes in topological order', () => {
        const nodes = new Set(['A', 'B', 'C', 'D', 'E']);
        const edges = [
            ['A', 'B'] as const,
            ['B', 'C'] as const,
            ['A', 'D'] as const,
            // E has no dependencies
        ];

        const sorted = toposort(nodes, edges);
        
        // Verify all nodes are present
        expect(sorted).toHaveLength(nodes.size);
        expect(new Set(sorted)).toEqual(nodes);
        
        // Verify dependencies are satisfied
        const indexOf = (node: string) => sorted.indexOf(node);
        expect(indexOf('A')).toBeLessThan(indexOf('B'));
        expect(indexOf('B')).toBeLessThan(indexOf('C'));
        expect(indexOf('A')).toBeLessThan(indexOf('D'));
    });

    it('should handle nodes with no dependencies', () => {
        const nodes = new Set(['A', 'B', 'C']);
        const edges = [
            ['A', 'B'] as const
            // C has no dependencies
        ];

        const sorted = toposort(nodes, edges);
        
        // Verify all nodes are present
        expect(sorted).toHaveLength(nodes.size);
        expect(new Set(sorted)).toEqual(nodes);
        
        // Verify dependencies are satisfied
        const indexOf = (node: string) => sorted.indexOf(node);
        expect(indexOf('A')).toBeLessThan(indexOf('B'));
        
        // C can be anywhere since it has no dependencies
        expect(sorted).toContain('C');
    });

    it('should handle nodes with multiple dependencies', () => {
        const nodes = new Set(['A', 'B', 'C', 'D']);
        const edges = [
            ['A', 'C'] as const,
            ['B', 'C'] as const,
            ['C', 'D'] as const
        ];

        const sorted = toposort(nodes, edges);
        
        // Verify all nodes are present
        expect(sorted).toHaveLength(nodes.size);
        expect(new Set(sorted)).toEqual(nodes);
        
        // Verify dependencies are satisfied
        const indexOf = (node: string) => sorted.indexOf(node);
        expect(indexOf('A')).toBeLessThan(indexOf('C'));
        expect(indexOf('B')).toBeLessThan(indexOf('C'));
        expect(indexOf('C')).toBeLessThan(indexOf('D'));
    });

    it('should throw error for cyclic dependencies', () => {
        const nodes = new Set(['A', 'B', 'C']);
        const edges = [
            ['A', 'B'] as const,
            ['B', 'C'] as const,
            ['C', 'A'] as const // Creates a cycle
        ];

        expect(() => toposort(nodes, edges)).toThrow('Graph contains cycles');
    });

    it('should handle complex dependency graphs', () => {
        const nodes = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
        const edges = [
            ['A', 'B'] as const,
            ['A', 'C'] as const,
            ['B', 'D'] as const,
            ['C', 'D'] as const,
            ['D', 'E'] as const,
            ['D', 'F'] as const,
            ['E', 'G'] as const,
            ['F', 'G'] as const
        ];

        const sorted = toposort(nodes, edges);
        
        // Verify all nodes are present
        expect(sorted).toHaveLength(nodes.size);
        expect(new Set(sorted)).toEqual(nodes);
        
        // Verify dependencies are satisfied
        const indexOf = (node: string) => sorted.indexOf(node);
        expect(indexOf('A')).toBeLessThan(indexOf('B'));
        expect(indexOf('A')).toBeLessThan(indexOf('C'));
        expect(indexOf('B')).toBeLessThan(indexOf('D'));
        expect(indexOf('C')).toBeLessThan(indexOf('D'));
        expect(indexOf('D')).toBeLessThan(indexOf('E'));
        expect(indexOf('D')).toBeLessThan(indexOf('F'));
        expect(indexOf('E')).toBeLessThan(indexOf('G'));
        expect(indexOf('F')).toBeLessThan(indexOf('G'));
    });

    it('should handle empty graph', () => {
        const nodes = new Set<string>();
        const edges: readonly [string, string][] = [];

        const sorted = toposort(nodes, edges);
        expect(sorted).toHaveLength(0);
    });

    it('should handle graph with no edges', () => {
        const nodes = new Set(['A', 'B', 'C']);
        const edges: readonly [string, string][] = [];

        const sorted = toposort(nodes, edges);
        
        // Verify all nodes are present
        expect(sorted).toHaveLength(nodes.size);
        expect(new Set(sorted)).toEqual(nodes);
        
        // Order doesn't matter since there are no dependencies
        expect(sorted).toContain('A');
        expect(sorted).toContain('B');
        expect(sorted).toContain('C');
    });
}); 