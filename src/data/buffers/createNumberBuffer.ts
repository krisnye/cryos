import { ArrayBufferLike_grow } from "../Array/ArrayBufferLike/grow";
import { I32Schema } from "../I32";
import { isNumberSchema, Schema } from "../Schema";
import { TypedArray, TypedArrayConstructor } from "../TypedArray";
import { U32Schema } from "../U32";
import { TypedBuffer } from "./TypedBuffer";

const getTypedArrayConstructor = (schema: Schema): TypedArrayConstructor => {
    if (isNumberSchema(schema)) {
        if (schema.type === "integer") {
            if (schema.minimum !== undefined && schema.maximum !== undefined) {
                if (schema.minimum >= U32Schema.minimum && schema.maximum <= U32Schema.maximum) {
                    return Uint32Array;
                }
                if (schema.minimum >= I32Schema.minimum && schema.maximum <= I32Schema.maximum) {
                    return Int32Array;
                }
            }
        }
        else if (schema.precision === 1) {
            return Float32Array;
        }
        return Float64Array;
    }
    throw new Error("Schema is not a valid number schema");
}

export const createNumberBuffer = (args: {
    schema: Schema,
    length?: number,
    maxLength?: number,
    arrayBuffer?: ArrayBufferLike,
}): TypedBuffer<number,TypedArray> => {
    const {
        schema,
        length = 16,
        maxLength = length,
    } = args;
    const typedArrayConstructor = getTypedArrayConstructor(schema);
    const stride = typedArrayConstructor.BYTES_PER_ELEMENT;
    const {
        arrayBuffer = new ArrayBuffer(stride * length, { maxByteLength: stride * maxLength }),
    } = args;
    const array = new typedArrayConstructor(arrayBuffer);
    const typedBuffer = {
        array,
        get length(): number {
            return array.length;
        },
        set length(value: number) {
            ArrayBufferLike_grow(arrayBuffer, value * stride);
        },
        get(index: number): number {
            return array[index];
        },
        set(index: number, value: number): void {
            array[index] = value;
        },
        move(fromIndex: number, toIndex: number): void {
            array[toIndex] = array[fromIndex];
        },
    } as const satisfies TypedBuffer<number,TypedArray>;
    return typedBuffer;
}