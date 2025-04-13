import { InferType, isNumberSchema, Schema } from "../Schema";
import { createStructBuffer } from "./createStructBuffer";
import { getStructLayout } from "./structs/getStructLayout";
import { TypedBuffer } from "./TypedBuffer";
import { createNumberBuffer } from "./createNumberBuffer";
import { createArrayBuffer } from "./createArrayBuffer";
import { TypedArray } from "../TypedArray";

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
