import { TypedBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";

export const toGPUBuffer = async <T>(
    buffer: TypedBuffer<T>,
    device: GPUDevice,
    byteLength?: number,
    offset?: number,
): Promise<GPUBuffer> => {
    const array = buffer.getTypedArray();
    byteLength ??= array.byteLength;
    offset ??= 0;
    const gpuBuffer = device.createBuffer({
        size: byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    await copyToGPUBuffer(buffer, device, gpuBuffer, byteLength, offset);

    return gpuBuffer;
}
