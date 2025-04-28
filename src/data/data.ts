import { Primitive } from "types";

export type Data = Primitive | ReadonlyArray<Data> | { readonly [key: string]: Data };
