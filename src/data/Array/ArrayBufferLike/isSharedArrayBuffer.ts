
export function ArrayBufferLike_isSharedArrayBuffer(arrayBuffer: ArrayBufferLike): arrayBuffer is SharedArrayBuffer {
    return "grow" in arrayBuffer;
}
