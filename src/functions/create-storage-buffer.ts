export interface StorageBufferOptions {
    /**
     * Initial data for the buffer
     */
    data: Float32Array | Uint32Array;
    /**
     * Whether this buffer should be used as a storage buffer
     */
    storage?: boolean;
    /**
     * Whether this buffer should be writable by the shader
     */
    writable?: boolean;
    /**
     * Label for the buffer
     */
    label?: string;
    /**
     * Whether this buffer can be copied to other buffers
     */
    copySrc?: boolean;
    /**
     * Whether this buffer can receive copies from other buffers
     */
    copyDst?: boolean;
}

export interface StorageBuffer {
    buffer: GPUBuffer;
    destroy(): void;
}

/**
 * Creates a storage buffer with the given options.
 * If storage is true, creates a storage buffer suitable for use in shaders.
 * If storage is false, creates a staging buffer suitable for data transfer.
 */
export function createStorageBuffer(
    device: GPUDevice,
    options: StorageBufferOptions
): StorageBuffer {
    const {
        data,
        storage = true,
        writable = false,
        copySrc = true,
        copyDst = true,
        label
    } = options;

    let usage = 0;
    
    if (storage) {
        usage |= GPUBufferUsage.STORAGE;
    } else {
        usage |= GPUBufferUsage.MAP_WRITE;
    }

    if (copySrc) {
        usage |= GPUBufferUsage.COPY_SRC;
    }
    if (copyDst) {
        usage |= GPUBufferUsage.COPY_DST;
    }

    const buffer = device.createBuffer({
        size: data.byteLength,
        usage,
        label,
    });

    if (!storage) {
        // For staging buffers, write the data immediately
        device.queue.writeBuffer(buffer, 0, data);
    } else {
        // For storage buffers, write initial data
        device.queue.writeBuffer(buffer, 0, data);
    }

    return {
        buffer,
        destroy() {
            buffer.destroy();
        }
    };
} 