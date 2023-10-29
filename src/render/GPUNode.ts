import { GPUContext } from "../core/GPUContext.js"
import { GPUUniformEntryHelper } from "../core/GPUUniformEntryHelper.js"
import { GPURenderPipelineAndMeta } from "../core/types.js"
import { Matrix4 } from "../math/Matrix4.js"
import { GPUMesh } from "./GPUMesh.js"
import { TRANSFORM_BINDGROUP_ENTRY_LAYOUT, TRANSFORM_BINDINGS } from "./GPUModelConstants.js"

interface Props {
    children?: GPUNode[]
    mesh?: GPUMesh
    bindGroup?: GPUBindGroup
    transformHelper?: GPUUniformEntryHelper<typeof TRANSFORM_BINDINGS>
    localTransform?: Matrix4
    modelTransform?: Matrix4
}

export class GPUNode {

    public children?: GPUNode[]
    public mesh?: GPUMesh
    private bindGroup?: GPUBindGroup
    private transformHelper?: GPUUniformEntryHelper<typeof TRANSFORM_BINDINGS>
    public localTransform?: Matrix4
    public modelTransform = Matrix4.identity

    constructor(props: Props) {
        this.children = props.children
        this.mesh = props.mesh
        this.bindGroup = props.bindGroup
        this.transformHelper = props.transformHelper
        this.localTransform = props.localTransform
        this.modelTransform = props.modelTransform ?? Matrix4.identity
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
            this.transformHelper = c.createUniformHelper(TRANSFORM_BINDGROUP_ENTRY_LAYOUT, TRANSFORM_BINDINGS, { modelMatrix: this.modelTransform })
            this.bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [c.camera.entry, this.transformHelper.entry]
            })
        }

    }

    prerender(c: GPUContext) {
        this.transformHelper?.commandCopyToGPU()
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