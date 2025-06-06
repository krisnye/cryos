import { grow } from "../array-buffer-like/grow";
import { DataView32 } from "../data-view-32/data-view-32";
import { createDataView32 } from "data/data-view-32/create-data-view-32";
import { FromSchema, Schema } from "../schema";
import { createReadStruct } from "./structs/create-read-struct";
import { createWriteStruct } from "./structs/create-write-struct";
import { getStructLayout } from "./structs/get-struct-layout";
import { TypedBuffer } from "./typed-buffer";
import { TypedArray } from "data/typed-array";

export const createStructBuffer = <S extends Schema, ArrayType extends keyof DataView32 = "f32">(
    args: {
        schema: S,
        length?: number,
        maxLength?: number,
        arrayBuffer?: ArrayBufferLike,
        arrayType?: ArrayType
    }
): TypedBuffer<FromSchema<S>> => {
    const { schema } = args;
    const layout = getStructLayout(schema);
    if (!layout) {
        throw new Error("Schema is not a valid struct schema");
    }
    const { length = 16, arrayType = 'f32' } = args;
    let arrayBuffer = args.arrayBuffer ?? new ArrayBuffer(length * layout.size);
    const read = createReadStruct<FromSchema<S>>(layout);
    const write = createWriteStruct<FromSchema<S>>(layout);

    let dataView = createDataView32(arrayBuffer);
    const sizeInQuads = layout.size / 4;

    let typedArray: TypedArray = dataView[arrayType];

    const buffer: TypedBuffer<FromSchema<S>> = {
        getTypedArray() {
            return typedArray;
        },
        get size() {
            return arrayBuffer.byteLength / layout.size;
        },
        set size(length: number) {
            // attempts to grow the array buffer in place, throws if it can't
            arrayBuffer = grow(arrayBuffer, length * layout.size, true);
            dataView = createDataView32(arrayBuffer);
            typedArray = dataView[arrayType] as DataView32[ArrayType];
        },
        get: (index: number) => read(dataView, index),
        set: (index: number, value: FromSchema<S>) => write(dataView, index, value),
        copyWithin: (target: number, start: number, end: number) => {
            dataView[arrayType].copyWithin(target * sizeInQuads, start * sizeInQuads, end * sizeInQuads);
        },
        [Symbol.iterator](): IterableIterator<FromSchema<S>> {
            let index = 0;
            const length = buffer.size;
            return {
                next(): IteratorResult<FromSchema<S>> {
                    if (index < length) {
                        const value = read(dataView, index);
                        index++;
                        return { value, done: false };
                    }
                    return { value: undefined, done: true };
                },
                [Symbol.iterator]() {
                    return this;
                }
            };
        },
    };
    return buffer;
}
