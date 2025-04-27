import { InferType, isNumberSchema, Schema } from "../schema";
import { createStructBuffer } from "./create-struct-buffer";
import { getStructLayout } from "./structs/get-struct-layout";
import { TypedBuffer } from "./typed-buffer";
import { createNumberBuffer } from "./create-number-buffer";
import { createArrayBuffer } from "./create-array-buffer";
import { TypedArray } from "../typed-array";

export const createTypedBuffer = <S extends Schema, T = InferType<S>>(
    args: {
        schema: S,
        length?: number,
        maxLength?: number,
    }
): TypedBuffer<InferType<S>> => {
    const { schema } = args;
    args.maxLength ??= 10_0000_000;

    if (isNumberSchema(schema)) {
        return createNumberBuffer(args) as TypedBuffer<InferType<S>,TypedArray>;
    }

    const structLayout = getStructLayout(schema, false);
    if (structLayout) {
        return createStructBuffer(args);
    }

    return createArrayBuffer<InferType<S>>(args);
}
