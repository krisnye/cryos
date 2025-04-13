
export interface DataView32 {
    readonly f32: Float32Array;
    readonly u32: Uint32Array;
    readonly i32: Int32Array;
}

export const createDataView32 = (arrayBufferLike: ArrayBufferLike): DataView32 => {
    return {
        f32: new Float32Array(arrayBufferLike),
        u32: new Uint32Array(arrayBufferLike),
        i32: new Int32Array(arrayBufferLike),
    };
};