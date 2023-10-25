import { GPUContext } from "../core/GPUContext.js"
import { GPUTextureHelper } from "../core/GPUTextureHelper.js"
import { GPURenderPipelineAndMeta } from "../core/types.js"
import { Vector4 } from "../math/Vector4.js"
import { MATERIAL_BINDGROUP_INDEX } from "./GPUModelConstants.js"

interface Props {
    name?: string
    metallicRoughness: MetallicRoughness
}

export interface MetallicRoughness {
    baseColorTexture: GPUTextureHelper
    baseColorFactor?: Vector4
    metallicFactor: number
    roughnessFactor: number
}

export class GPUMaterial {

    public name?: string
    public metallicRoughness: MetallicRoughness
    public bindGroup!: GPUBindGroup

    constructor(c: GPUContext, props: Props) {
        this.name = props.name
        this.metallicRoughness = props.metallicRoughness
    }

    static readonly bindGroupLayoutEntries = [
        ...GPUTextureHelper.getBindGroupLayoutEntries(0)    //  baseColorTexture
    ]

    getBindGroupEntries() {
        return [
            ...this.metallicRoughness.baseColorTexture.getBindGroupEntries(0)
        ]
    }

    buildRenderPipeline(
        c: GPUContext,
        pipeline: GPURenderPipelineAndMeta
    ) {
        this.bindGroup = c.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(MATERIAL_BINDGROUP_INDEX),
            entries: this.getBindGroupEntries()
        })
    }

}
