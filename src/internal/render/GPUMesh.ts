import { GPUContext } from "../core/GPUContext.js"
import { GPURenderPipelineAndMeta } from "../core/types.js"
import { GPUPrimitive } from "./GPUPrimitive.js"

export class GPUMesh {

    constructor(
        public readonly name: string,
        public readonly primitives: GPUPrimitive[],
    ) {
    }

    buildRenderPipeline(
        c: GPUContext,
        pipeline: GPURenderPipelineAndMeta
    ) {
        // We take a pretty simple approach to start. Just loop through all the primitives and
        // build their respective render pipelines
        for (let primitive of this.primitives) {
            primitive.buildRenderPipeline(c, pipeline);
        }
    }

    render(c: GPUContext, uniformsBG: GPUBindGroup) {
        // We take a pretty simple approach to start. Just loop through all the primitives and
        // call their individual draw methods
        for (let primitive of this.primitives) {
            primitive.render(c, uniformsBG);
        }
    }

}

