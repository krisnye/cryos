import { FromSchema, Schema } from "@adobe/data/schema";
import { createStructBuffer, getStructLayout } from "@adobe/data/typed-buffer";

export const createStructGPUBuffer = <S extends Schema>(
    args: {
        device: GPUDevice,
        schema: S,
        elements: FromSchema<S>[],
        usage: GPUBufferUsageFlags,
    }
): GPUBuffer => {
    const {
        device,
        schema,
        elements,
        usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    } = args;
    const layout = getStructLayout(schema)!;
    const buffer = device.createBuffer({
        size: Math.max(elements.length, 1) * layout.size,
        usage: usage,
        mappedAtCreation: true,
    });
    const typedBuffer = createStructBuffer({schema, arrayBuffer: buffer.getMappedRange()});
    for (let i = 0; i < elements.length; i++) {
        typedBuffer.set(i, elements[i]);
    }
    buffer.unmap();
    return buffer;    
}

