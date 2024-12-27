type StorageBufferType = "f32" | "i32" | "u32";
type StorageBufferTypedArray<T extends StorageBufferType> = T extends "f32" ? Float32Array : T extends "i32" ? Int32Array : Uint32Array;
type StorageBufferTypeFromTypedArray<T extends StorageBufferTypedArray<any>> = T extends Float32Array ? "f32" : T extends Int32Array ? "i32" : "u32";

export interface StorageBuffer<T extends StorageBufferType> {
    /**
     * The underlying GPU buffer
     */
    readonly buffer: GPUBuffer;

    /**
     * Get the raw typed array for reading or writing.
     * If markDirty is true, the buffer will be marked for update on next maybeWriteToGPU.
     */
    getValues(markDirty?: boolean): StorageBufferTypedArray<T>;

    /**
     * Write CPU values to GPU if they've changed since last write
     */
    maybeWriteToGPU(): void;

    /**
     * Read current GPU values back to CPU.
     * Only available for buffers created with GPUBufferUsage.MAP_READ
     */
    readFromGPU(): Promise<void>;

    /**
     * Resize the buffer to the new element count.
     * Preserves existing data up to the new size.
     * New elements are initialized to 0.
     */
    resize(elementCount: number): void;

    /**
     * Clean up resources
     */
    destroy(): void;
}

export interface StorageBufferOptions {
    /**
     * Whether the buffer can be read from GPU back to CPU
     */
    readable?: boolean;

    /**
     * Whether the buffer can be written from CPU to GPU
     */
    writable?: boolean;

    /**
     * Whether the buffer can be used as a storage buffer in shaders
     * Defaults to true
     */
    storage?: boolean;

    /**
     * Optional label for the buffer
     */
    label?: string;
}

export function createStorageBuffer<T extends Float32Array | Int32Array | Uint32Array>(
    device: GPUDevice,
    initialData: T,
    options: StorageBufferOptions = {}
): StorageBuffer<StorageBufferTypeFromTypedArray<T>> {
    const {
        readable = false,
        writable = true,
        storage = true,
        label
    } = options;

    // Set up buffer usage flags
    let usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    if (readable) usage |= GPUBufferUsage.MAP_READ;
    if (writable) usage |= GPUBufferUsage.MAP_WRITE;
    if (storage) usage |= GPUBufferUsage.STORAGE;

    // Create the GPU buffer with 256-byte alignment
    const size = Math.ceil(initialData.byteLength / 256) * 256;
    let buffer = device.createBuffer({
        size,
        usage,
        mappedAtCreation: true,
        label
    });

    // Initialize buffer with data
    let values = new (initialData.constructor as any)(initialData);
    let arrayBuffer: ArrayBuffer | undefined = buffer.getMappedRange();
    new (values.constructor as any)(arrayBuffer).set(initialData);
    buffer.unmap();
    arrayBuffer = undefined;

    let isDirty = false;
    let stagingBuffer: GPUBuffer | undefined;

    return {
        buffer,
        
        getValues(markDirty = false) {
            if (markDirty && !writable) {
                throw new Error("Buffer is not writable");
            }
            isDirty ||= markDirty;
            return values;
        },

        resize(elementCount: number) {
            const newSize = Math.ceil(elementCount * values.BYTES_PER_ELEMENT / 256) * 256;
            if (newSize === buffer.size) return;

            // Create new buffer
            const newBuffer = device.createBuffer({
                size: newSize,
                usage,
                mappedAtCreation: false,
                label
            });

            // Create new values array
            const newValues = new (values.constructor as any)(newSize / values.BYTES_PER_ELEMENT);
            newValues.set(values);
            values = newValues;

            // Create or resize staging buffer if needed
            if (!stagingBuffer || stagingBuffer.size < newSize) {
                stagingBuffer?.destroy();
                stagingBuffer = device.createBuffer({
                    size: newSize,
                    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                    mappedAtCreation: true,
                    label: `${label ?? "storage"}-staging`
                });
            }

            // Write to staging buffer
            const arrayBuffer = stagingBuffer.getMappedRange();
            new (values.constructor as any)(arrayBuffer).set(values);
            stagingBuffer.unmap();

            // Copy from staging to new buffer
            const encoder = device.createCommandEncoder();
            encoder.copyBufferToBuffer(
                stagingBuffer,
                0,
                newBuffer,
                0,
                Math.min(buffer.size, newSize)
            );
            device.queue.submit([encoder.finish()]);

            // Clean up old buffer
            buffer.destroy();
            buffer = newBuffer;
            isDirty = false;
        },

        maybeWriteToGPU() {
            if (!isDirty || !writable) return;

            // Create staging buffer if needed
            if (!stagingBuffer || stagingBuffer.size < buffer.size) {
                stagingBuffer?.destroy();
                stagingBuffer = device.createBuffer({
                    size: buffer.size,
                    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                    mappedAtCreation: true,
                    label: `${label ?? "storage"}-staging`
                });

                // Write data to staging buffer
                const arrayBuffer = stagingBuffer.getMappedRange();
                new (values.constructor as any)(arrayBuffer).set(values);
                stagingBuffer.unmap();
            }

            // Copy from staging buffer to storage buffer
            const encoder = device.createCommandEncoder();
            encoder.copyBufferToBuffer(
                stagingBuffer,
                0,
                buffer,
                0,
                buffer.size
            );
            device.queue.submit([encoder.finish()]);
            isDirty = false;
        },

        async readFromGPU() {
            if (!readable) {
                throw new Error("Buffer is not readable");
            }

            // Create staging buffer if needed
            if (!stagingBuffer || stagingBuffer.size < buffer.size) {
                stagingBuffer?.destroy();
                stagingBuffer = device.createBuffer({
                    size: buffer.size,
                    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
                    label: `${label ?? "storage"}-staging`
                });
            }

            // Copy from storage buffer to staging buffer
            const encoder = device.createCommandEncoder();
            encoder.copyBufferToBuffer(
                buffer,
                0,
                stagingBuffer,
                0,
                buffer.size
            );
            device.queue.submit([encoder.finish()]);

            // Read from staging buffer
            await stagingBuffer.mapAsync(GPUMapMode.READ);
            const arrayBuffer = stagingBuffer.getMappedRange();
            values = new (values.constructor as any)(arrayBuffer);
            stagingBuffer.unmap();
        },

        destroy() {
            buffer.destroy();
            stagingBuffer?.destroy();
        }
    };
} 