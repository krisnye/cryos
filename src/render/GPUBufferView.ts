
export class GPUBufferView {
    public readonly length: number;
    public readonly byteStride: number;
    public readonly view: Uint8Array;
    public needsUpload = false;
    public gpuBuffer?: GPUBuffer;
    public usage: GPUBufferUsageFlags;

    constructor(buffer: Uint8Array, view) {
        this.length = view["byteLength"];
        this.byteStride = 0;
        if (view["byteStride"] !== undefined) {
            this.byteStride = view["byteStride"];
        }
        // Create the buffer view. Note that subarray creates a new typed
        // view over the same array buffer, we do not make a copy here.
        let viewOffset = 0;
        if (view["byteOffset"] !== undefined) {
            viewOffset = view["byteOffset"];
        }
        this.view = buffer.subarray(viewOffset, viewOffset + this.length);
        this.needsUpload = false;
        this.usage = 0;
    }

    public addUsage(usage: GPUBufferUsageFlags) {
        this.usage = this.usage | usage;
    }

    public upload(device: GPUDevice) {
        // Note: must align to 4 byte size when mapped at creation is true
        let buf = device.createBuffer({
            size: Math.ceil(this.view.byteLength / 4) * 4,
            usage: this.usage,
            mappedAtCreation: true
        });
        new Uint8Array(buf.getMappedRange()).set(this.view);
        buf.unmap();
        this.gpuBuffer = buf;
        this.needsUpload = false;
    }
}
