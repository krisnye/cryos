import { GPUContext } from "./GPUContext.js";
import { getWGSLSize } from "./functions.js";
import { StringKeyOf, WGSLToCPUType, WGSLType } from "./types.js";

type WGSLTypesToCPUTypes<Bindings extends Record<string, WGSLType>> = {
    [K in StringKeyOf<Bindings>]: WGSLToCPUType<Bindings[K]>
}

export class GPUUniformEntryHelper<Bindings extends Record<string, WGSLType>> {

    public readonly layout: Readonly<GPUBindGroupLayoutEntry>
    private buffer: GPUBuffer
    public readonly entry: Readonly<GPUBindGroupEntry>

    constructor(
        private readonly context: GPUContext,
        layout: {
            binding: GPUIndex32,
            visibility: GPUShaderStageFlags,
        },
        private readonly bindings: Bindings,
    ) {
        this.layout = { ...layout, buffer: { type: "uniform" } }
        let size = Object.values(bindings).map(getWGSLSize).reduce((a, b) => a + b, 0)
        size = Math.ceil(size / 16) * 16    // pad to units of 16 bytes
        this.buffer = context.device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.entry = { binding: layout.binding, resource: { buffer: this.buffer } }
    }

    commandCopyToBuffer(values: WGSLTypesToCPUTypes<Bindings>) {
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
        this.context.commandCopyToBuffer(data, this.buffer)
    }

}
