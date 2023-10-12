import { GPUContext } from "./GPUContext.js";
import { getWGSLSize } from "./functions.js";
import { StringKeyOf, WGSLToCPUType, WGSLType, WGSLVectorType } from "./types.js";

type WGSLTypesToCPUTypes<Bindings extends Record<string, WGSLType>> = {
    [K in StringKeyOf<Bindings>]: WGSLToCPUType<Bindings[K]>
}

const PAD_SIZE = 16

/**
 * We only support f32 or vector/matrix of f32 as uniform inputs.
 */
export type UniformType = WGSLVectorType | "f32"
export type UniformBindings = Record<string, UniformType>

export class GPUUniformEntryHelper<Bindings extends UniformBindings> {

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
        size = Math.ceil(size / PAD_SIZE) * PAD_SIZE    // pad to units of 16 bytes
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
