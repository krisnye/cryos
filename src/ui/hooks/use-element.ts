import { Component_stack } from "./component/stack.js";

/**
 * Hook that returns the currently active component.
 */
export function useElement<T = HTMLElement>(): T {
    return Component_stack.active() as unknown as T;
}
