import { Observe } from "./observe";
import { Unobserve } from "./unobserve";

export function toPromise<T>(observable: Observe<T>): Promise<T> {
    return new Promise((resolve) => {
        let resolved = false;
        let unsubscribe: Unobserve | undefined;
        unsubscribe = observable(value => {
            if (resolved) return;
            resolve(value);
            resolved = true;
            unsubscribe?.();
            unsubscribe = undefined;
        });
        if (resolved) {
            unsubscribe?.();
        }
    });
}

