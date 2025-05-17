import { Indexed } from "data/indexed/indexed";

export interface TypedBuffer<T,A extends ArrayLike<unknown> = ArrayLike<unknown>> extends Indexed<T> {
    // TODO: get rid of array?
    array: A;
}
