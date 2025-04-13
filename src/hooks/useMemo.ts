import { useEffect } from "./useEffect.js";
import { useState } from "./useState.js";

export function useMemo<T>(calculateValue: () => T, dependencies: unknown[] = []): T {
    const [state, setState] = useState<T | undefined>(undefined);
    let currentValue = state;

    useEffect(() => {
        currentValue = calculateValue();
        setState(currentValue);
    }, dependencies);

    return currentValue!;
}