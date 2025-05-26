import { Data } from 'data/data.js';
import type { Schema, StringSchema, NumberSchema, BooleanSchema, NullSchema, ArraySchema, ObjectSchema } from './schema.js';
import type { Assert, Equal } from 'types';
import { D } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';

// Helper type to create tuples of a specific length
type TupleOf<T, N extends number, R extends readonly T[] = []> = 
    R['length'] extends N 
        ? R 
        : TupleOf<T, N, readonly [...R, T]>;

// Helper type to handle fixed-length arrays
type InferArrayType<T extends ArraySchema> = 
    T['minItems'] extends number 
        ? T['maxItems'] extends T['minItems']
            ? T['items'] extends Schema
                ? TupleOf<FromSchema<T['items']>, T['minItems']>
                : unknown[]
            : T['items'] extends Schema
                ? readonly FromSchema<T['items']>[]
                : unknown[]
        : T['items'] extends Schema
            ? readonly FromSchema<T['items']>[]
            : unknown[];

// Helper type to handle object properties
type InferProperties<T> = T extends Record<string, Schema> ? {
    readonly[K in keyof T]: FromSchema<T[K]>;
} : never;

// Utility type to infer TypeScript type from Schema
export type FromSchema<T> = T extends { default: infer D } ? D
    : T extends { const: infer C } ? C
    : T extends { enum: readonly (infer E)[] } ? E
    : T extends StringSchema ? string
    : T extends NumberSchema ? number
    : T extends BooleanSchema ? boolean
    : T extends NullSchema ? null
    : T extends ArraySchema ? InferArrayType<T>
    : T extends ObjectSchema ? (
        T['properties'] extends Record<string, Schema> 
            ? InferProperties<T['properties']>
            : Record<string, unknown>
    )
    : unknown;

type SchemaValid<S extends Schema, T> = Equal<FromSchema<Omit<S, 'default'>>, T>;

// Type inference tests
type __TypeTests = {
    // Primitive types
    string: Assert<Equal<FromSchema<{ type: 'string' }>, string>>;
    number: Assert<Equal<FromSchema<{ type: 'number' }>, number>>;
    integer: Assert<Equal<FromSchema<{ type: 'integer' }>, number>>;
    boolean: Assert<Equal<FromSchema<{ type: 'boolean' }>, boolean>>;
    null: Assert<Equal<FromSchema<{ type: 'null' }>, null>>;

    // Const values
    constString: Assert<Equal<FromSchema<{ const: "foo" }>, "foo">>;
    constNumber: Assert<Equal<FromSchema<{ const: 42 }>, 42>>;
    constObject: Assert<Equal<
        FromSchema<{ const: { x: 1, y: "hello" } }>,
        { x: 1; y: "hello" }
    >>;

    // Enum values
    enumString: Assert<Equal<
        FromSchema<{ enum: ["red", "green", "blue"] }>,
        "red" | "green" | "blue"
    >>;
    enumMixed: Assert<Equal<
        FromSchema<{ enum: [1, "two", true] }>,
        1 | "two" | true
    >>;

    // Arrays
    simpleArray: Assert<Equal<
        FromSchema<{ type: 'array'; items: { type: 'string' } }>,
        readonly string[]
    >>;
    arrayWithConst: Assert<Equal<
        FromSchema<{ type: 'array'; items: { const: 42 } }>,
        readonly 42[]
    >>;
    arrayWithEnum: Assert<Equal<
        FromSchema<{ type: 'array'; items: { enum: ["a", "b"] } }>,
        readonly ("a" | "b")[]
    >>;

    // Objects
    simpleObject: Assert<Equal<
        FromSchema<{
            type: 'object';
            properties: {
                str: { type: 'string' };
                num: { type: 'number' };
                constVal: { const: true };
                enumVal: { enum: [1, 2, 3] };
            };
        }>,
        {
            readonly str: string;
            readonly num: number;
            readonly constVal: true;
            readonly enumVal: 1 | 2 | 3;
        }
    >>;

    // Nested structures
    nested: Assert<Equal<
        FromSchema<{
            type: 'object';
            properties: {
                name: { const: "config" };
                settings: {
                    type: 'object';
                    properties: {
                        mode: { enum: ["light", "dark"] };
                        items: {
                            type: 'array';
                            items: {
                                type: 'object';
                                properties: {
                                    id: { type: 'number' };
                                    label: { type: 'string' };
                                };
                            };
                        };
                    };
                };
            };
        }>,
        {
            readonly name: "config";
            readonly settings: {
                readonly mode: "light" | "dark";
                readonly items: readonly{
                    readonly id: number;
                    readonly label: string;
                }[];
            };
        }
    >>;

    // Error cases
    // @ts-expect-error const value should be exact
    invalidConst: Assert<Equal<FromSchema<{ const: "foo" }>, string>>;

    // @ts-expect-error enum should be exact union
    invalidEnum: Assert<Equal<FromSchema<{ enum: [1, 2] }>, number>>;

    // @ts-expect-error array items should match exactly
    invalidArray: Assert<Equal<
        FromSchema<{ type: 'array'; items: { type: 'string' } }>,
        number[]
    >>;

    // @ts-expect-error object properties should match exactly
    invalidObject: Assert<Equal<
        FromSchema<{
            type: 'object';
            properties: { value: { type: 'string' } };
        }>,
        { value: number }
    >>;

    // Fixed-length array tests up to 16
    fixedArray1: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 1;
            maxItems: 1;
        }>,
        readonly [number]
    >>;

    fixedArray2: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 2;
            maxItems: 2;
        }>,
        readonly [number, number]
    >>;

    fixedArray3: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 3;
            maxItems: 3;
        }>,
        readonly [number, number, number]
    >>;

    fixedArray4: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 4;
            maxItems: 4;
        }>,
        readonly [number, number, number, number]
    >>;

    fixedArray8: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 8;
            maxItems: 8;
        }>,
        readonly [number, number, number, number, number, number, number, number]
    >>;

    fixedArray16: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 16;
            maxItems: 16;
        }>,
        readonly [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]
    >>;

    // Should still work with variable length arrays
    variableArray: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'number' };
            minItems: 2;
            maxItems: 4;
        }>,
        readonly number[]
    >>;

    // Should work with no length constraints
    unlimitedArray: Assert<Equal<
        FromSchema<{
            type: 'array';
            items: { type: 'boolean' };
        }>,
        readonly boolean[]
    >>;

};
