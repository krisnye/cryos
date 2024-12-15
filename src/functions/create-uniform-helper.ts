import { DataType, FromDataType } from "../types/data-types.js";
import { sizeOf } from "./size-of.js";
import { createTypedBufferWriter } from "./create-typed-buffer-writer.js";

export type UniformHelper<U> = {
    values: { -readonly [K in keyof U]: U[K] };
    maybeWriteToGPU(): void;
    buffer: GPUBuffer;
    size: number;
}

type UniformValues<T extends Record<string, DataType>> = { [K in keyof T]: FromDataType<T[K]> };

const f32Size = sizeOf("f32");

export function createUniformHelper<T extends Record<string, DataType>>(device: GPUDevice, types: T, initialValues: UniformValues<T>): UniformHelper<UniformValues<T>> {
    const fieldOffsets = new Map<string, number>();
    const size = sizeOf(types, fieldOffsets);
    
    // Check that all field offsets are properly aligned to 4 bytes (sizeof f32)
    for (const [name, offset] of fieldOffsets) {
        if (offset % f32Size !== 0) {
            throw new Error(`Field ${name} has invalid alignment. Offset ${offset} is not divisible by ${f32Size} bytes`);
        }
        // Keep byte offsets as they are, don't convert to array indices
        fieldOffsets.set(name, offset);
    }

    const buffer = device.createBuffer({
        size: size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bufferWriter = createTypedBufferWriter(size);
    let isDirty = false;

    const result = {
        maybeWriteToGPU: () => {
            if (isDirty) {
                device.queue.writeBuffer(buffer, 0, bufferWriter.byteArray);
                isDirty = false;
            }
        },
        values: {} as UniformValues<T>,
        buffer,
        size
    } as UniformHelper<UniformValues<T>>;

    const currentValues = { ...initialValues };
    // Add getters/setters for each root field
    for (const [prop, type] of Object.entries(types)) {
        Object.defineProperty(result.values, prop, {
            get: () => currentValues[prop],
            set: (value: any) => {
                (currentValues as any)[prop] = value;
                const offset = fieldOffsets.get(prop)!;
                bufferWriter.write(type, value, offset);
                isDirty = true;
            },
            enumerable: true
        });
    }

    Object.assign(result.values, currentValues);

    return result;
}