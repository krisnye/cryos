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

    constructor(
        private readonly context: GPUContext,
        layout: {
            binding: GPUIndex32,
            visibility: GPUShaderStageFlags,
        },
        private readonly bindings: Bindings,
        values?: UniformValues<Bindings>
    ) {
        this.layout = { ...layout, buffer: { type: "uniform" } }
        let size = Object.values(bindings).map(getWGSLSize).reduce((a, b) => a + b, 0)
        size = Math.ceil(size / PAD_SIZE) * PAD_SIZE    // pad to units of 16 bytes
        this.buffer = context.device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.entry = { binding: layout.binding, resource: { buffer: this.buffer } }
        if (values) {
            this.setValues(values)
        }
    }

    public destroy() {
        this.buffer.destroy()
    }

    // TODO: HERE, set values, only flush to buffer when actually changed.
    private toData(values: UniformValues<Bindings>): number[] {
        let data: number[] = []
        // read in order of bindings
        for (let name of Object.keys(this.bindings)) {
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
    public setValues(values: UniformValues<Bindings>) {
        const data = this.toData(values)
        if (!this._data || !arrayEquals(this._data, data)) {
            this.dirty = true
            this._data = data
        }
    }

    commandCopyToBuffer(values?: UniformValues<Bindings>) {
        if (values) {
            this.setValues(values)
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
