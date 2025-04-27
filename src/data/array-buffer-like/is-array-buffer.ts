
export function isArrayBuffer(arrayBuffer: ArrayBufferLike): boolean {
    return "resize" in arrayBuffer;
}
