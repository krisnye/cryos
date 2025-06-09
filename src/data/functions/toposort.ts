type Edge<T> = readonly [from: T, to: T];

type NodeSet<T> = ReadonlySet<T>;
type EdgeList<T> = ReadonlyArray<Edge<T>>;
type SortedNodes<T> = ReadonlyArray<T>;

/**
 * Performs a topological sort on a directed acyclic graph
 * @param nodes - Set of all nodes in the graph
 * @param edges - List of edges representing dependencies (from -> to)
 * @returns Sorted array of nodes where each node appears after its dependencies
 * @throws Error if graph contains cycles
 */
export const toposort = <T>(nodes: NodeSet<T>, edges: EdgeList<T>): SortedNodes<T> => {
    // Create adjacency list for efficient dependency lookup
    const adjacencyList = new Map<T, Set<T>>();
    const inDegree = new Map<T, number>();
    
    // Initialize all nodes with 0 in-degree
    for (const node of nodes) {
        adjacencyList.set(node, new Set());
        inDegree.set(node, 0);
    }
    
    // Build adjacency list and count in-degrees
    for (const [from, to] of edges) {
        const dependents = adjacencyList.get(from) ?? new Set();
        dependents.add(to);
        adjacencyList.set(from, dependents);
        
        const currentInDegree = inDegree.get(to) ?? 0;
        inDegree.set(to, currentInDegree + 1);
    }
    
    // Find all nodes with no dependencies (in-degree = 0)
    const queue: T[] = [];
    for (const [node, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(node);
        }
    }
    
    const result: T[] = [];
    let visitedCount = 0;
    
    // Process nodes in topological order
    while (queue.length > 0) {
        const node = queue.shift()!;
        result.push(node);
        visitedCount++;
        
        // Reduce in-degree for all dependents
        const dependents = adjacencyList.get(node) ?? new Set();
        for (const dependent of dependents) {
            const currentInDegree = inDegree.get(dependent) ?? 0;
            const newInDegree = currentInDegree - 1;
            inDegree.set(dependent, newInDegree);
            
            if (newInDegree === 0) {
                queue.push(dependent);
            }
        }
    }
    
    // Check for cycles (if we haven't visited all nodes)
    if (visitedCount !== nodes.size) {
        throw new Error('Graph contains cycles');
    }
    
    return result;
};

// Example usage:
/*
const nodes = new Set(['A', 'B', 'C', 'D', 'E']);
const edges = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'A', to: 'D' },
    // E has no dependencies
];

const sorted = toposort(nodes, edges);
// Result: ['A', 'D', 'B', 'C', 'E'] or ['A', 'B', 'D', 'C', 'E']
*/ 