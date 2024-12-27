export interface StorageAccess {
    read: boolean;
    write: boolean;
}

export function parseComputeStorageAccess(source: string, resourceNames: string[]): Record<string, StorageAccess> {
    const access: Record<string, StorageAccess> = {};

    resourceNames.forEach(name => {
        access[name] = { read: false, write: false };
    });

    const computeMatch = source.match(/fn\s+main\s*\([^{]*\)[^{]*{([^}]*)}/);
    if (!computeMatch) {
        console.warn("Compute shader entry point not found");
        return access;
    }

    const computeCode = computeMatch[1];
    resourceNames.forEach(name => {
        // Check for write access first
        const writePatterns = [
            `${name}\\[.*\\]\\s*=`,          // Array index write
            `${name}\\[.*\\]\\..*\\s*=`,     // Struct field write
            `${name}\\..*\\s*=`,             // Direct struct write
            `store\\s*&${name}`,             // Direct storage write
        ];
        
        // Check for read access - only count reads that aren't part of writes
        const readPatterns = [
            `let\\s+\\w+\\s*=\\s*${name}`,   // Direct assignment
            `let\\s+\\w+\\s*=.*${name}\\[`,  // Used in expression
            `=\\s*.*${name}\\[(?!.*=)`,      // Used on right side of assignment
        ];
        
        if (writePatterns.some(pattern => new RegExp(pattern).test(computeCode))) {
            access[name].write = true;
        }

        if (readPatterns.some(pattern => new RegExp(pattern).test(computeCode))) {
            access[name].read = true;
        }
    });

    return access;
} 