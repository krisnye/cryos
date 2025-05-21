
interface DataObject extends Record<string, Data> {
}

export type Data = string | number | boolean | null | ReadonlyArray<Data> | { readonly [key: string]: Data } | DataObject & object;
