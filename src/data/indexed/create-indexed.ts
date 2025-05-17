import { Indexed } from "./indexed";

let initialized = false;

export function createIndexed<T>(iterable: Iterable<T>): Indexed<T> {
    let array = Array.isArray(iterable) ? iterable : Array.from(iterable);
    if (!initialized) {
        initialized = true;

        Object.defineProperty(Array.prototype, "get", {
            value(this: unknown[], i: number) {
                return this[i];
            },
            writable: false,
            configurable: false,
            enumerable: false,
        });

        /** Add `set` only once, likewise sealed. */
        Object.defineProperty(Array.prototype, "set", {
            value(this: unknown[], i: number, v: unknown) {
                this[i] = v;
            },
            writable: false,
            configurable: false,
            enumerable: false,
        });
    }

    return array as unknown as Indexed<T>;
}