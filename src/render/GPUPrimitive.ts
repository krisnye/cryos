import { GPUContext } from "../core/GPUContext.js"
import { sizeof, vertexFormatToCount, vertexFormatToSize } from "../core/functions.js"
import { GPURenderPipelineAndMeta } from "../core/types.js"
import { GPUAccessor } from "./GPUAccessor.js"
import { GPUMaterial } from "./GPUMaterial.js"
import { CAMERA_TRANSFORM_BINDGROUP_INDEX, MATERIAL_BINDGROUP_INDEX, GPU_MODEL_VERTEX_FORMAT } from "./GPUModelConstants.js"

interface Props {
    positions: GPUAccessor
    normals?: GPUAccessor
    texcoords?: GPUAccessor
    topology: GPUPrimitiveTopology
    indices?: GPUAccessor
    material: GPUMaterial
}

export class GPUPrimitive {
    public positions: GPUAccessor
    public normals?: GPUAccessor
    public texcoords?: GPUAccessor
    public indices?: GPUAccessor
    public topology: GPUPrimitiveTopology
    public renderPipeline!: GPURenderPipeline
    public material: GPUMaterial

    constructor(props: Props) {
        this.topology = props.topology
        this.material = props.material

        this.positions = props.positions
        this.positions.view.needsUpload = true
        this.positions.view.addUsage(GPUBufferUsage.VERTEX)

        this.normals = props.normals
        if (this.normals) {
            this.normals.view.needsUpload = true
            this.normals.view.addUsage(GPUBufferUsage.VERTEX)
        }

        this.texcoords = props.texcoords
        if (this.texcoords) {
            this.texcoords.view.needsUpload = true
            this.texcoords.view.addUsage(GPUBufferUsage.VERTEX)
        }

        this.indices = props.indices
        if (this.indices) {
            this.indices.view.needsUpload = true
            this.indices.view.addUsage(GPUBufferUsage.INDEX)
        }
    }

    buildRenderPipeline(
        c: GPUContext,
        defaultPipeline: GPURenderPipelineAndMeta
    ) {
        if (this.renderPipeline) {
            return
        }
        const { device } = c
        const shaderModule = defaultPipeline.descriptor.vertex.module
        const colorFormat = c.canvasContext.getCurrentTexture().format
        const depthFormat = c.depthTexture.format
        const uniformsBGLayout = defaultPipeline.getBindGroupLayout(0)
        const materialBGLayout = defaultPipeline.getBindGroupLayout(1)

        this.material.buildRenderPipeline(c, defaultPipeline)

        const DEBUG = true
        if (DEBUG) {
            const view = this.texcoords!.view
            const countPerVertex = vertexFormatToCount[this.texcoords!.vertexType]
            const elements = this.texcoords!.count * countPerVertex
            const floatArray = new Float32Array(view.data.buffer, view.data.byteOffset, elements)
            console.log(`?? texcoords`, { floatArray, texcoords: this.texcoords })
        }

        // Vertex attribute state and shader stage
        const vertexState = {
            // Shader stage info
            module: shaderModule,
            entryPoint: "vertex_main",
            // Vertex buffer info
            buffers: [{
                arrayStride: this.positions.byteStride,
                attributes:
                    [
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
            }, {
                arrayStride: this.normals!.byteStride,
                attributes:
                    [
                        {
                            format: this.normals!.vertexType,
                            offset: 0,
                            shaderLocation: 1,
                        },
                    ]
            }, {
                arrayStride: this.texcoords!.byteStride,
                attributes:
                    [
                        {
                            format: this.texcoords!.vertexType,
                            offset: 0,
                            shaderLocation: 2,
                        }
                    ]
            }]
        } as const satisfies GPUVertexState

        const fragmentState = {
            // Shader info
            module: shaderModule,
            entryPoint: "fragment_main",
            // Output render target info
            targets: [{ format: colorFormat }]
        } as const satisfies GPUFragmentState

        // Our loader only supports triangle lists and strips, so by default we set
        // the primitive topology to triangle list, and check if it's instead a triangle strip
        const primitive: GPUPrimitiveState = { topology: "triangle-list" }
        if (this.topology == "triangle-strip") {
            primitive.topology = "triangle-strip"
            primitive.stripIndexFormat = this.indices!.vertexType as GPUIndexFormat
        }

        const layout = device.createPipelineLayout({ bindGroupLayouts: [uniformsBGLayout, materialBGLayout] })
        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: primitive,
            depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: "less" }
        })
    }

    render(c: GPUContext, cameraTransformsBG: GPUBindGroup) {
        c.render.setPipeline(this.renderPipeline)
        c.render.setBindGroup(CAMERA_TRANSFORM_BINDGROUP_INDEX, cameraTransformsBG)
        c.render.setBindGroup(MATERIAL_BINDGROUP_INDEX, this.material.bindGroup)
        // Apply the accessor's byteOffset here to handle both global and interleaved
        // offsets for the buffer. Setting the offset here allows handling both cases,
        // with the downside that we must repeatedly bind the same buffer at different
        // offsets if we're dealing with interleaved attributes.
        // Since we only handle positions at the moment, this isn't a problem.
        c.render.setVertexBuffer(GPU_MODEL_VERTEX_FORMAT.slots.position,
            this.positions.view.gpuBuffer!)
        if (this.normals) {
            c.render.setVertexBuffer(GPU_MODEL_VERTEX_FORMAT.slots.normal,
                this.normals.view.gpuBuffer!)
        }
        if (this.texcoords) {
            c.render.setVertexBuffer(GPU_MODEL_VERTEX_FORMAT.slots.texcoords,
                this.texcoords.view.gpuBuffer!)
        }
        if (this.indices) {
            c.render.setIndexBuffer(this.indices.view.gpuBuffer!,
                this.indices.vertexType as GPUIndexFormat)
            c.render.drawIndexed(this.indices.count)
        } else {
            c.render.draw(this.positions.count)
        }
    }
}
