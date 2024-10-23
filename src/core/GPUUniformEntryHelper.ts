import { arrayEquals } from "../math/functions.js";
import { GPUContext } from "./GPUContext.js";
import { getWGSLSize } from "./functions.js";
import { UniformBindings, UniformValues } from "./types.js";

const PAD_SIZE = 16

export class GPUUniformEntryHelper<Bindings extends UniformBindings> {

    public readonly layout: Readonly<GPUBindGroupLayoutEntry>
    private buffer: GPUBuffer
    public readonly entry: Readonly<GPUBindGroupEntry>
    private _data?: number[]
    private dirty = true
    private _values: UniformValues<Bindings>

    constructor(
        private readonly context: GPUContext,
        layout: {
            binding: GPUIndex32,
            visibility: GPUShaderStageFlags,
        },
        private readonly bindings: Bindings,
        values: UniformValues<Bindings>
    ) {
        this.layout = { ...layout, buffer: { type: "uniform" } }
        let size = Object.values(bindings).map(getWGSLSize).reduce((a, b) => a + b, 0)
        size = Math.ceil(size / PAD_SIZE) * PAD_SIZE    // pad to units of 16 bytes
        this.buffer = context.device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.entry = { binding: layout.binding, resource: { buffer: this.buffer } }
        this.values = this._values = values
    }

    public destroy() {
        this.buffer.destroy()
    }

    private toData(values: UniformValues<Bindings>): number[] {
        let data: number[] = []
        // read in order of bindings
        for (let name in this.bindings) {
            let value = values[name]
            if (value[Symbol.iterator]) {
                data.push(...value as Iterable<number>)
            }
            else {
                data.push(value as number)
            }
        }
        return data
    }

    /**
     * Sets the values for this uniform binding.
     * You will still have to call commandCopyToBuffer before rendering
     * to copy the data to the GPUBuffer.
     */
    public set values(values: UniformValues<Bindings>) {
        const data = this.toData(values)
        if (!this._data || !arrayEquals(this._data, data)) {
            this.dirty = true
            this._data = data
        }
    }

    public get values(): UniformValues<Bindings> {
        return this._values
    }

    public patch(values: Partial<UniformValues<Bindings>>) {
        this.values = { ...this._values, ...values };
    }

    commandCopyToGPU(values?: UniformValues<Bindings>) {
        if (values) {
            this.values = values
        }
        if (this.dirty) {
            if (!this._data) {
                throw new Error("You have to set values before copying to buffer")
            }
            this.context.commandCopyToBuffer(this._data, this.buffer)
            this.dirty = false
        }
    }

}
