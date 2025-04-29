import { useEffect } from "./use-effect.js";
import { useState } from "./use-state.js";

export function useMemo<T>(calculateValue: () => T, dependencies: unknown[] = []): T {
    const [state, setState] = useState<T | undefined>(undefined);
    let currentValue = state;

    useEffect(() => {
        currentValue = calculateValue();
        setState(currentValue);
    }, dependencies);

    return currentValue!;
}