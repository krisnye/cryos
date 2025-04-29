import { Data } from "data/data";
import { Notify } from "./notify";
import { Observe } from "./observe";
import { SetValue } from "./set-value";

/**
 * Creates an observable state with a value and a set of observers.
 * @param initialValue - The initial value of the state.
 * @returns A tuple containing the observe function and the setValue function.
 */
export const createObservableState = <T extends Data>(initialValue: T): [Observe<T>, SetValue<T>] => {
    let value = initialValue;
    const observers = new Set<Notify<T>>();

    const observe = (observer: Notify<T>) => {
        observers.add(observer);
        observer(value);
        return () => observers.delete(observer);
    }

    const setValue = (newValue: T) => {
        value = newValue;
        for (const observer of observers) {
            observer(value);
        }
    }

    return [observe, setValue];
}