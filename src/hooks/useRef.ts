import { useState } from "./useState.js";

export function useRef<T>(value: T): { value: T } {
    const [state] = useState({ value });
    return state;
}
