import type { Component } from "./Component/Component.js";
import { Component_stack } from "./Component/stack.js";

export function withHooks<This extends Component, Args extends any[], Return>(
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Return>
): TypedPropertyDescriptor<(this: This, ...args: Args) => Return> {
    const originalMethod = descriptor.value!;
    descriptor.value = function(this: This, ...args: Args): Return {
        Component_stack.push(this);
        try {
            return originalMethod.apply(this, args);
        }
        finally {
            Component_stack.pop();
        }
    }
    return descriptor;
}
