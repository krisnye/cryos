
export function ArrayBufferLike_isArrayBuffer(arrayBuffer: ArrayBufferLike): boolean {
    return "resize" in arrayBuffer;
}
