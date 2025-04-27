import { Notify } from "./notify";
import { Observe } from "./observe";
import { SetValue } from "./set-value";

/**
 * Creates an observable state with a value and a set of observers.
 * @param initialValue - The initial value of the state.
 * @returns A tuple containing the observe function and the setValue function.
 */
export const createObservableState = <T>(initialValue: T): [Observe<T>, SetValue<T>] => {
    let value = initialValue;
    const observers = new Set<Notify<T>>();

    const observe = (observer: Notify<T>) => {
        observers.add(observer);
        observer(value);
        return () => observers.delete(observer);
    }

    const setValue = (newValue: T) => {
        value = newValue;
        observers.forEach(observer => observer(value));
    }

    return [observe, setValue];
}