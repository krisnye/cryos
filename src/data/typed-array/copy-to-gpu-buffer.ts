
import { TypedBuffer } from "../typed-buffer";
import { TypedArray } from ".";

export const copyToGPUBuffer = <T>(
    typedBuffer: TypedBuffer<T>,
    device: GPUDevice,
    gpuBuffer: GPUBuffer,
    byteLength?: number,
    offset?: number,
): GPUBuffer => {
    const array = typedBuffer.getTypedArray();
    byteLength ??= array.byteLength;
    offset ??= 0;
    if (gpuBuffer.size < byteLength) {
        gpuBuffer.destroy();
        gpuBuffer = device.createBuffer({
            size: byteLength,
            usage: gpuBuffer.usage,
            mappedAtCreation: false,
        });
    }
    device.queue.writeBuffer(gpuBuffer, 0, array.buffer, offset, byteLength);
    return gpuBuffer;
}
