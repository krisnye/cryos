////////////////////////////////////////////////////////////////////////////////
// Meta Types
////////////////////////////////////////////////////////////////////////////////

export type Mutable<T> = T extends infer U ? { -readonly [K in keyof U]: U[K] } : T

export type FilterByValueType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
};

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type FlattenProperties<T> = Mutable<UnionToIntersection<T[keyof FilterByValueType<T,object>]>>;

type AllKeys<T> = T extends any ? keyof T : never;

type PropertyType<T, K> = T extends any
  ? K extends keyof T
    ? T[K]
    : never
  : never;

export type Simplify<T> = T extends Function
  ? T
  : T extends any[]
    ? T
    : T extends object
      ? {
          [K in AllKeys<T>]: Simplify<PropertyType<T, K>>;
        }
      : T;

type NominalType<T, Brand> = T & { __brand?: Brand };
type EmptyObject = NominalType<Record<string, never>, 'empty'>;
export type EmptyToNever<T> = keyof T extends never ? EmptyObject : T;
