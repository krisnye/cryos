import { GPUContext, cameraLayout } from "../core/GPUContext.js"
import { GPUUniformEntryHelper } from "../core/GPUUniformEntryHelper.js"
import { GPURenderPipelineAndMeta, UniformBindings } from "../core/types.js"
import { Matrix4 } from "../math/Matrix4.js"
import { GPUMesh } from "./GPUMesh.js"

export const transformBinding = { model: "mat4x4" } satisfies UniformBindings
export const transformLayout = { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry
export const defaultBindGroup0Layout = [cameraLayout, transformLayout] satisfies GPUBindGroupLayoutEntry[]

export class GPUNode {

    public children?: GPUNode[]
    public mesh?: GPUMesh
    private bindGroup?: GPUBindGroup
    private transformHelper?: GPUUniformEntryHelper<typeof transformBinding>
    public localTransform?: Matrix4
    public modelTransform = Matrix4.identity

    constructor(props: Partial<GPUNode>) {
        Object.assign(this, props)
    }

    buildRenderPipeline(
        c: GPUContext,
        pipeline: GPURenderPipelineAndMeta
    ) {
        this.mesh?.buildRenderPipeline(c, pipeline)
        if (this.children) {
            for (let child of this.children) {
                child.buildRenderPipeline(c, pipeline)
            }
        }

        if (this.mesh) {
            this.transformHelper = c.createUniformHelper(transformLayout, transformBinding, { model: this.modelTransform })
            this.bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [c.camera.entry, this.transformHelper.entry]
            })
        }

    }

    prerender(c: GPUContext) {
        this.transformHelper?.commandCopyToBuffer()
        if (this.children) {
            for (let child of this.children) {
                child.prerender(c)
            }
        }
    }

    render(c: GPUContext) {
        if (this.mesh) {
            this.mesh.render(c, this.bindGroup!)
        }
        if (this.children) {
            for (let child of this.children) {
                child.render(c)
            }
        }
    }
}