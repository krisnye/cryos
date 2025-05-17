import { grow } from "../array-buffer-like/grow";
import { I32Schema } from "../i32";
import { isNumberSchema, Schema } from "../schema";
import { TypedArray, TypedArrayConstructor } from "../typed-array";
import { U32Schema } from "../u32";
import { TypedBuffer } from "./typed-buffer";

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
}): TypedBuffer<number> => {
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
    let array = new typedArrayConstructor(arrayBuffer);
    const typedBuffer = {
        getTypedArray() {
            return array;
        },
        get length(): number {
            return array.length;
        },
        set length(value: number) {
            grow(arrayBuffer, value * stride);
        },
        get(index: number): number {
            return array[index];
        },
        set(index: number, value: number): void {
            array[index] = value;
        },
        copyWithin(target: number, start: number, end: number): void {
            array.copyWithin(target, start, end);
        },
        [Symbol.iterator](): IterableIterator<number> {
            return array[Symbol.iterator]();
        },
    } as const satisfies TypedBuffer<number>;
    return typedBuffer;
}