import { ArrayBufferLike_copy } from "./copy";
import { ArrayBufferLike_isArrayBuffer } from "./isArrayBuffer";
import { ArrayBufferLike_isSharedArrayBuffer } from "./isSharedArrayBuffer";

export function ArrayBufferLike_grow<T extends ArrayBufferLike>(arrayBuffer: T, newCapacity: number, createNewIfNeeded = false): T {
    if (newCapacity <= arrayBuffer.byteLength) {
        throw new Error("Cannot shrink");
    }
    if (ArrayBufferLike_isSharedArrayBuffer(arrayBuffer)) {
        if (arrayBuffer.maxByteLength >= newCapacity) {
            arrayBuffer.grow(newCapacity);
            return arrayBuffer;
        }
        if (createNewIfNeeded) {
            const newArrayBuffer = new SharedArrayBuffer(newCapacity);
            ArrayBufferLike_copy(arrayBuffer, newArrayBuffer);
            return newArrayBuffer as T;
        }
    }
    else if (ArrayBufferLike_isArrayBuffer(arrayBuffer)) {
        if (arrayBuffer.maxByteLength >= newCapacity) {
            arrayBuffer.resize(newCapacity);
            return arrayBuffer;
        }
        if (createNewIfNeeded) {
            const newArrayBuffer = new ArrayBuffer(newCapacity) as T;
            ArrayBufferLike_copy(arrayBuffer, newArrayBuffer);
            return newArrayBuffer;
        }
    }
    throw new Error("Cannot grow");
}