import { DataView32 } from "./data-view-32";

export const createDataView32 = (arrayBufferLike: ArrayBufferLike): DataView32 => {
    return {
        f32: new Float32Array(arrayBufferLike),
        u32: new Uint32Array(arrayBufferLike),
        i32: new Int32Array(arrayBufferLike),
    };
};
