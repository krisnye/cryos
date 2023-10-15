import { GPUContext } from "../core/GPUContext.js";
import { GPURenderPipelineAndMeta } from "../core/types.js";
import { GPUAccessor } from "./GPUAccessor.js";


export class GPUPrimitive {
    public positions: GPUAccessor;
    public indices?: GPUAccessor;
    public topology: GPUPrimitiveTopology;
    public renderPipeline!: GPURenderPipeline;

    constructor(positions: GPUAccessor, topology: GPUPrimitiveTopology, indices?: GPUAccessor) {
        this.positions = positions;
        this.indices = indices;
        this.topology = topology;
        this.positions.view.needsUpload = true;
        this.positions.view.addUsage(GPUBufferUsage.VERTEX);
        if (this.indices) {
            this.indices.view.needsUpload = true;
            this.indices.view.addUsage(GPUBufferUsage.INDEX);
        }
    }

    buildRenderPipeline(
        c: GPUContext,
        pipeline: GPURenderPipelineAndMeta
    ) {
        if (this.renderPipeline) {
            return;
        }
        const { device } = c;
        const shaderModule = pipeline.descriptor.vertex.module;
        const colorFormat = c.canvasContext.getCurrentTexture().format;
        const depthFormat = c.depthTexture.format;
        const uniformsBGLayout = pipeline.getBindGroupLayout(0);

        // Vertex attribute state and shader stage
        const vertexState = {
            // Shader stage info
            module: shaderModule,
            entryPoint: "vertex_main",
            // Vertex buffer info
            buffers: [{
                arrayStride: this.positions.byteStride,
                attributes: [
                    // Note: We do not pass the positions.byteOffset here, as its
                    // meaning can vary in different glB files, i.e., if it's being used
                    // for an interleaved element offset or an absolute offset.
                    //
                    // Setting the offset here for the attribute requires it to be <= byteStride,
                    // as would be the case for an interleaved vertex buffer.
                    //
                    // Offsets for interleaved elements can be passed here if we find
                    // a single buffer is being referenced by multiple attributes and
                    // the offsets fit within the byteStride. For simplicity we do not
                    // detect this case right now, and just take each buffer independently
                    // and apply the offset (per-element or absolute) in setVertexBuffer.
                    {
                        format: this.positions.vertexType,
                        offset: 0,
                        shaderLocation: 0,
                    }
                ]
            }]
        } as const satisfies GPUVertexState;

        const fragmentState = {
            // Shader info
            module: shaderModule,
            entryPoint: "fragment_main",
            // Output render target info
            targets: [{ format: colorFormat }]
        } as GPUFragmentState;

        // Our loader only supports triangle lists and strips, so by default we set
        // the primitive topology to triangle list, and check if it's instead a triangle strip
        const primitive: GPUPrimitiveState = { topology: "triangle-list" };
        if (this.topology == "triangle-strip") {
            primitive.topology = "triangle-strip";
            primitive.stripIndexFormat = this.indices!.vertexType as GPUIndexFormat;
        }

        const layout = device.createPipelineLayout({ bindGroupLayouts: [uniformsBGLayout] });
        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: primitive,
            depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: "less" }
        });
    }

    render(c: GPUContext, uniformsBG: GPUBindGroup) {
        c.render.setPipeline(this.renderPipeline);
        c.render.setBindGroup(0, uniformsBG);
        // Apply the accessor's byteOffset here to handle both global and interleaved
        // offsets for the buffer. Setting the offset here allows handling both cases,
        // with the downside that we must repeatedly bind the same buffer at different
        // offsets if we're dealing with interleaved attributes.
        // Since we only handle positions at the moment, this isn't a problem.
        c.render.setVertexBuffer(0,
            this.positions.view.gpuBuffer!,
            this.positions.byteOffset,
            this.positions.byteLength);
        if (this.indices) {
            c.render.setIndexBuffer(this.indices.view.gpuBuffer!,
                this.indices.vertexType as GPUIndexFormat,
                this.indices.byteOffset,
                this.indices.byteLength);
            c.render.drawIndexed(this.indices.count);
        } else {
            c.render.draw(this.positions.count);
        }
    }
}
