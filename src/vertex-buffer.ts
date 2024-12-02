import { VertexAttributes, VertexBuffer } from "./types/resource-types.js";

export function createVertexBuffer<VA extends VertexAttributes>(
    device: GPUDevice,
    attributes: VA,
    data: ArrayLike<number>
): VertexBuffer<VA> {
    const buffer = device.createBuffer({
        size: data.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });

    //  Technically, these values could be float or int or booleans.
    //  We may fix this later.
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
}
