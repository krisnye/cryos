import { TypedBuffer } from "../buffers";
import { TypedArray } from "../TypedArray";
import { copyToGPUBuffer } from "../TypedArray/copyToGPUBuffer";

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
