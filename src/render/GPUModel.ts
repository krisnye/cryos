import { GPUContext } from "../core/GPUContext.js";
import { GPURenderPipelineAndMeta } from "../core/types.js";
import { GPUMesh } from "./GPUMesh.js";
import { GPUNode } from "./GPUNode.js";

export class GPUModel {

    constructor(
        public readonly meshes: GPUMesh[],
        public readonly scenes: GPUNode[]
    ) {
    }

    buildRenderPipeline(
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
    }

    render(c: GPUContext) {
        for (let scene of this.scenes) {
            scene.render(c)
        }
    }

    destroy() {
        //  TODO: destroy any created resources.        
    }
}