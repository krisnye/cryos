export interface StorageAccess {
    read: boolean;
    write: boolean;
}

export function parseComputeStorageAccess(source: string, resourceNames: string[]): Record<string, StorageAccess> {
    const access: Record<string, StorageAccess> = {};

    resourceNames.forEach(name => {
        access[name] = { read: false, write: false };
    });

    const computeMatch = source.match(/fn\s+compute_main\s*\([^{]*\)[^{]*{([^}]*)}/);
    if (!computeMatch) {
        console.warn("Compute shader entry point not found");
        return access;
    }

    const computeCode = computeMatch[1];
    resourceNames.forEach(name => {
        const writePatterns = [
            `${name}\\[.*\\]\\s*=`,          // Array index write
            `${name}\\[.*\\]\\..*\\s*=`,     // Struct field write
            `${name}\\..*\\s*=`,             // Direct struct write
            `store\\s*&${name}`,             // Direct storage write
        ];
        
        if (writePatterns.some(pattern => new RegExp(pattern).test(computeCode))) {
            access[name].write = true;
        }
        
        if (computeCode.includes(name)) {
            access[name].read = true;
        }
    });

    return access;
} 