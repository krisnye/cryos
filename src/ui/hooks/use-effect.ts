import type { Component } from "./component/component.js"
import * as ARRAY from "../../data/array/index.js";
import { Component_stack } from "./component/stack.js";

export type EffectCallback = () => (void | (() => void))
type EffectHookState = { dispose?: () => void, dependencies: unknown[] };

export function useEffect<T extends Component>(callback: EffectCallback, dependencies: unknown[] = []) {
    const component = Component_stack.active() as T;
    const hookIndex = component.hookIndex++;
    const oldHookState = component.hooks[hookIndex] as EffectHookState | undefined;
    let rerunEffect = !oldHookState || !ARRAY.equalsShallow(dependencies, oldHookState.dependencies);
    if (rerunEffect) {
        oldHookState?.dispose?.();
        component.hooks[hookIndex] = { dispose: callback.call(component) ?? undefined, dependencies };
    }
}
