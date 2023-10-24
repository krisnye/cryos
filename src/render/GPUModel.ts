import { GPUContext } from "../core/GPUContext.js";
import { GPUTextureHelper } from "../core/GPUTextureHelper.js";
import { GPURenderPipelineAndMeta, GPURenderPipelineProperties } from "../core/types.js";
import { GPUMaterial } from "./GPUMaterial.js";
import { GPUMesh } from "./GPUMesh.js";
import { GPU_MODEL_BINDGROUP_LAYOUTS, GPU_MODEL_VERTEX_FORMAT } from "./GPUModelConstants.js";
import { GPUNode } from "./GPUNode.js";

interface Props {
    meshes: GPUMesh[],
    scenes: GPUNode[],
    textures: GPUTextureHelper[],
    materials: GPUMaterial[],
}

export class GPUModel {

    public readonly meshes: GPUMesh[]
    public readonly scenes: GPUNode[]
    public readonly textures: GPUTextureHelper[]
    public readonly materials: GPUMaterial[]
    public shader!: string
    public pipeline!: GPURenderPipelineAndMeta

    constructor(
        props: Props
    ) {
        this.meshes = props.meshes
        this.scenes = props.scenes
        this.textures = props.textures
        this.materials = props.materials
    }

    public async initialize(c: GPUContext, shader: string): Promise<void> {
        this.shader = shader
        // we can ALWAYS make the same bind groups
        const descriptor = {
            layout: GPU_MODEL_BINDGROUP_LAYOUTS,
            vertexInput: GPU_MODEL_VERTEX_FORMAT.layout,
            shader: this.shader
        } satisfies GPURenderPipelineProperties
        this.pipeline = await c.createRenderPipeline(descriptor)
        console.log(`INIT`, this.pipeline)

        this.buildRenderPipeline(c, this.pipeline)
    }

    private buildRenderPipeline(
        c: GPUContext,
        pipeline: GPURenderPipelineAndMeta
    ) {
        // c.canvasContext.getCurrentTexture().format
        // c.depthTexture.format
        for (let scene of this.scenes) {
            scene.buildRenderPipeline(c, pipeline)
        }
    }

    prerender(c: GPUContext) {
        for (let scene of this.scenes) {
            scene.prerender(c)
        }
        for (let texture of this.textures) {
            texture.commandCopyToGPU()
        }
    }

    render(c: GPUContext) {
        for (let scene of this.scenes) {
            scene.render(c)
        }
    }

    destroy() {
        for (let texture of this.textures) {
            texture.destroy()
        }
    }

}