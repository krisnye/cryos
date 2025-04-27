import { copy } from "./copy";
import { isArrayBuffer } from "./is-array-buffer";
import { isSharedArrayBuffer } from "./is-shared-array-buffer";

export function grow<T extends ArrayBufferLike>(arrayBuffer: T, newCapacity: number, createNewIfNeeded = false): T {
    if (newCapacity <= arrayBuffer.byteLength) {
        throw new Error("Cannot shrink");
    }
    if (isSharedArrayBuffer(arrayBuffer)) {
        if (arrayBuffer.maxByteLength >= newCapacity) {
            arrayBuffer.grow(newCapacity);
            return arrayBuffer;
        }
        if (createNewIfNeeded) {
            const newArrayBuffer = new SharedArrayBuffer(newCapacity);
            copy(arrayBuffer, newArrayBuffer);
            return newArrayBuffer as T;
        }
    }
    else if (isArrayBuffer(arrayBuffer)) {
        if (arrayBuffer.maxByteLength >= newCapacity) {
            arrayBuffer.resize(newCapacity);
            return arrayBuffer;
        }
        if (createNewIfNeeded) {
            const newArrayBuffer = new ArrayBuffer(newCapacity) as T;
            copy(arrayBuffer, newArrayBuffer);
            return newArrayBuffer;
        }
    }
    throw new Error("Cannot grow");
}