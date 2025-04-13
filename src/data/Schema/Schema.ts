type PrimitiveType = 'string' | 'number' | 'boolean' | 'null' | 'integer';

interface BaseSchema<T = unknown> {
    type?: PrimitiveType | 'array' | 'object';
    title?: string;
    description?: string;
    default?: T;
    examples?: T[];
    enum?: T[];
    const?: T;
    $ref?: string;
}

export interface StringSchema extends BaseSchema<string> {
    type: 'string';
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
}

export interface NumberSchema extends BaseSchema<number> {
    type: 'number' | 'integer';
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    precision?: 1 | 2;
}

export interface BooleanSchema extends BaseSchema<boolean> {
    type: 'boolean';
}

export interface NullSchema extends BaseSchema<null> {
    type: 'null';
}

export interface ArraySchema<T = unknown> extends BaseSchema<T[]> {
    type: 'array';
    items?: Schema | Schema[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    contains?: Schema;
    additionalItems?: Schema | boolean;
}

export interface ObjectSchema<T = Record<string, unknown>> extends BaseSchema<T> {
    type: 'object';
    properties?: Record<string, Schema>;
    required?: string[];
    additionalProperties?: Schema | boolean;
    minProperties?: number;
    maxProperties?: number;
    propertyNames?: StringSchema;
}

interface CombinerSchema<T = unknown> extends BaseSchema<T> {
    allOf?: Schema[];
    anyOf?: Schema[];
    oneOf?: Schema[];
}

export type Schema = 
    | StringSchema 
    | NumberSchema 
    | BooleanSchema 
    | NullSchema 
    | ArraySchema 
    | ObjectSchema 
    | CombinerSchema;

export const isNumberSchema = (schema: Schema): schema is NumberSchema =>
    schema.type === 'number' || schema.type === 'integer';

export const isStringSchema = (schema: Schema): schema is StringSchema =>
    schema.type === 'string';

export const isBooleanSchema = (schema: Schema): schema is BooleanSchema =>
    schema.type === 'boolean';

export const isNullSchema = (schema: Schema): schema is NullSchema =>
    schema.type === 'null';

export const isArraySchema = (schema: Schema): schema is ArraySchema =>
    schema.type === 'array';

export const isObjectSchema = (schema: Schema): schema is ObjectSchema =>
    schema.type === 'object';
