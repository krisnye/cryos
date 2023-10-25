
interface Props {
    data: Uint8Array
    byteStride?: number
}

export class GPUBufferView {

    public readonly byteStride: number;
    public readonly data: Uint8Array;
    public needsUpload = false;
    public gpuBuffer?: GPUBuffer;
    public usage: GPUBufferUsageFlags;

    constructor(props: Props) {
        const { data, byteStride = 0 } = props
        this.data = data
        this.byteStride = byteStride
        this.needsUpload = false;
        this.usage = 0;
    }

    public addUsage(usage: GPUBufferUsageFlags) {
        this.usage = this.usage | usage;
    }

    public upload(device: GPUDevice) {
        // Note: must align to 4 byte size when mapped at creation is true
        const buf = device.createBuffer({
            size: Math.ceil(this.data.byteLength / 4) * 4,
            usage: this.usage,
            mappedAtCreation: true,
        });
        const arrayBuffer = buf.getMappedRange()
        new Uint8Array(arrayBuffer).set(this.data);
        buf.unmap();
        this.gpuBuffer = buf;
        this.needsUpload = false;
    }
}
