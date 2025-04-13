import { useEffect } from "./useEffect.js";
import { useMemo } from "./useMemo.js";

export function useWindowEvent<K extends keyof WindowEventMap>(
    event: K,
    callbackFactory: () => (e: WindowEventMap[K]) => void,
    deps: any[] = []
) {
    const callback = useMemo(callbackFactory, deps);
    useEffect(() => {
        window.addEventListener(event, callback);
        return () => window.removeEventListener(event, callback);
    }, [callback]);
}