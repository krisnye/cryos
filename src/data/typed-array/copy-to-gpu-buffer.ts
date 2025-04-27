
import { TypedBuffer } from "../typed-buffer";
import { TypedArray } from ".";

export const copyToGPUBuffer = <T,A extends TypedArray>(
    typedBuffer: TypedBuffer<T,A>,
    device: GPUDevice,
    gpuBuffer: GPUBuffer,
    byteLength = typedBuffer.array.byteLength,
    offset = 0,
): GPUBuffer => {
    const { array } = typedBuffer;
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
