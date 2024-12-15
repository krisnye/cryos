import { DataType, FromDataType } from "../types/data-types.js";
import { sizeOf } from "./size-of.js";
import { getBaseAlignment } from "./get-base-alignment.js";
import { align } from "./align.js";

export type UniformHelper<U> = U & {
    maybeWriteToGPU(commandEncoder: GPUCommandEncoder): void;
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

    const byteArray = new ArrayBuffer(size);
    const f32Array = new Float32Array(byteArray);
    const u32Array = new Uint32Array(byteArray);
    const i32Array = new Int32Array(byteArray);

    let isDirty = false;
    const values = { ...initialValues };

    function writeValueToBuffer(type: DataType, value: any, arrayOffset: number): number {
        if (typeof type === 'object' && !Array.isArray(type)) {
            // Handle struct types by following the type definition order
            let totalWritten = 0;
            const structAlignment = getBaseAlignment(type);
            
            // Align the struct itself
            const alignedOffset = Math.ceil(arrayOffset / structAlignment) * structAlignment;
            const initialPadding = alignedOffset - arrayOffset;
            totalWritten += initialPadding;

            for (const [fieldName, fieldType] of Object.entries(type)) {
                const fieldValue = value[fieldName];
                const fieldAlignment = getBaseAlignment(fieldType as DataType);
                
                // Align each field according to its base alignment
                totalWritten = align(totalWritten, fieldAlignment);
                
                const written = writeValueToBuffer(
                    fieldType as DataType, 
                    fieldValue, 
                    alignedOffset + totalWritten
                );
                totalWritten += written;
            }

            // Pad struct to its alignment requirement
            return align(totalWritten, structAlignment);
        } else if (Array.isArray(value)) {
            // For vectors/matrices, write array values with proper alignment
            const vecAlignment = getBaseAlignment(type);
            const paddedOffset = Math.ceil(arrayOffset / vecAlignment) * vecAlignment;
            
            // Write the actual values
            for (let i = 0; i < value.length; i++) {
                f32Array[paddedOffset / 4 + i] = value[i];
            }
            
            // For vec3, we need to pad to vec4 alignment
            return type === "vec3" ? 16 : value.length * 4;
        } else {
            // Handle scalar types
            const scalarAlignment = getBaseAlignment(type);
            const paddedOffset = Math.ceil(arrayOffset / scalarAlignment) * scalarAlignment;
            
            if (type === "f32") {
                f32Array[paddedOffset / 4] = value;
            } else if (type === "u32") {
                u32Array[paddedOffset / 4] = value;
            } else if (type === "i32") {
                i32Array[paddedOffset / 4] = value;
            }
            return 4; // Size of scalar types
        }
    }

    const result = {
        maybeWriteToGPU: (commandEncoder: GPUCommandEncoder) => {
            if (isDirty) {
                device.queue.writeBuffer(buffer, 0, byteArray);
                isDirty = false;
            }
        }
    } as UniformHelper<UniformValues<T>>;

    // Add getters/setters for each root field
    for (const [prop, type] of Object.entries(types)) {
        Object.defineProperty(result, prop, {
            get: () => values[prop],
            set: (value: any) => {
                (values as any)[prop] = value;
                const offset = fieldOffsets.get(prop)!;
                writeValueToBuffer(type, value, offset);
                isDirty = true;
            },
            enumerable: true
        });
    }

    Object.assign(result, values);

    return result;
}