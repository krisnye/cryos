import { Schema } from "@adobe/data/schema";
import { createStructBuffer, getStructLayout } from "@adobe/data/typed-buffer";

export const createStructGPUBuffer = <S extends Schema>(
    schema: S,
    args: {
        device: GPUDevice;
        elements: Schema.ToType<S>[];
        usage: GPUBufferUsageFlags;
    }
): GPUBuffer => {
    const {
        device,
        elements,
        usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    } = args;
    const layout = getStructLayout(schema);
    if (!layout) {
        throw new Error("Schema is not a valid struct schema");
    }
    const buffer = device.createBuffer({
        size: Math.max(elements.length, 1) * layout.size,
        usage: usage,
        mappedAtCreation: true,
    });
    const typedBuffer = createStructBuffer(schema, buffer.getMappedRange());
    for (let i = 0; i < elements.length; i++) {
        typedBuffer.set(i, elements[i]);
    }
    buffer.unmap();
    return buffer;    
};

