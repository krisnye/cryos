
export function isSharedArrayBuffer(arrayBuffer: ArrayBufferLike): arrayBuffer is SharedArrayBuffer {
    return "grow" in arrayBuffer;
}
