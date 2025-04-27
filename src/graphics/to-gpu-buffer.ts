import { TypedBuffer } from "data/typed-buffer";
import { TypedArray, copyToGPUBuffer } from "data/typed-array";

export const toGPUBuffer = async <T,A extends TypedArray>(
    buffer: TypedBuffer<T,A>,
    device: GPUDevice,
    byteLength = buffer.array.byteLength,
    offset = 0,
): Promise<GPUBuffer> => {
    const gpuBuffer = device.createBuffer({
        size: byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    await copyToGPUBuffer(buffer, device, gpuBuffer, byteLength, offset);

    return gpuBuffer;
}
