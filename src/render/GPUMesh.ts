
export interface GPUAccessor {
    count: number
    view: GPUBufferView
    byteOffset: number
    byteStride: number
    byteLength: number
    vertexType: GPUVertexFormat
}

export class GPUPrimitive {
    public positions: GPUAccessor
    public indices?: GPUAccessor
    public topology: GPUPrimitiveTopology
    public renderPipeline!: GPURenderPipeline

    constructor(positions: GPUAccessor, topology: GPUPrimitiveTopology, indices?: GPUAccessor) {
        this.positions = positions
        this.indices = indices
        this.topology = topology
        this.positions.view.needsUpload = true
        this.positions.view.addUsage(GPUBufferUsage.VERTEX)
        if (this.indices) {
            this.indices.view.needsUpload = true
            this.indices.view.addUsage(GPUBufferUsage.INDEX)
        }
    }

    buildRenderPipeline(
        device: GPUDevice,
        shaderModule: GPUShaderModule,
        colorFormat: GPUTextureFormat,
        depthFormat: GPUTextureFormat,
        uniformsBGLayout: GPUBindGroupLayout
    ) {
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
        } as const satisfies GPUVertexState

        const fragmentState = {
            // Shader info
            module: shaderModule,
            entryPoint: "fragment_main",
            // Output render target info
            targets: [{ format: colorFormat }]
        } as GPUFragmentState

        // Our loader only supports triangle lists and strips, so by default we set
        // the primitive topology to triangle list, and check if it's instead a triangle strip
        const primitive: GPUPrimitiveState = { topology: "triangle-list" }
        if (this.topology == "triangle-strip") {
            primitive.topology = "triangle-strip"
            primitive.stripIndexFormat = this.indices!.vertexType as GPUIndexFormat
        }

        const layout = device.createPipelineLayout({ bindGroupLayouts: [uniformsBGLayout] })
        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: primitive,
            depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: "less" }
        })
    }

    render(renderPassEncoder: GPURenderPassEncoder, uniformsBG: GPUBindGroup) {
        renderPassEncoder.setPipeline(this.renderPipeline)
        renderPassEncoder.setBindGroup(0, uniformsBG)
        // Apply the accessor's byteOffset here to handle both global and interleaved
        // offsets for the buffer. Setting the offset here allows handling both cases,
        // with the downside that we must repeatedly bind the same buffer at different
        // offsets if we're dealing with interleaved attributes.
        // Since we only handle positions at the moment, this isn't a problem.
        renderPassEncoder.setVertexBuffer(0,
            this.positions.view.gpuBuffer!,
            this.positions.byteOffset,
            this.positions.byteLength)
        if (this.indices) {
            renderPassEncoder.setIndexBuffer(this.indices.view.gpuBuffer!,
                this.indices.vertexType as GPUIndexFormat,
                this.indices.byteOffset,
                this.indices.byteLength)
            renderPassEncoder.drawIndexed(this.indices.count)
        } else {
            renderPassEncoder.draw(this.positions.count)
        }
    }
}

export class GPUBufferView {
    public readonly length: number
    public readonly byteStride: number
    public readonly view: Uint8Array
    public needsUpload = false
    public gpuBuffer?: GPUBuffer
    public usage: GPUBufferUsageFlags

    constructor(buffer: Uint8Array, view) {
        this.length = view["byteLength"]
        this.byteStride = 0
        if (view["byteStride"] !== undefined) {
            this.byteStride = view["byteStride"]
        }
        // Create the buffer view. Note that subarray creates a new typed
        // view over the same array buffer, we do not make a copy here.
        let viewOffset = 0
        if (view["byteOffset"] !== undefined) {
            viewOffset = view["byteOffset"]
        }
        this.view = buffer.subarray(viewOffset, viewOffset + this.length)
        this.needsUpload = false
        this.usage = 0
    }

    public addUsage(usage: GPUBufferUsageFlags) {
        this.usage = this.usage | usage
    }

    public upload(device: GPUDevice) {
        // Note: must align to 4 byte size when mapped at creation is true
        let buf = device.createBuffer({
            size: Math.ceil(this.view.byteLength / 4) * 4,
            usage: this.usage,
            mappedAtCreation: true
        })
        new Uint8Array(buf.getMappedRange()).set(this.view)
        buf.unmap()
        this.gpuBuffer = buf
        this.needsUpload = false
    }
}

export class GPUMesh {

    constructor(
        public readonly primitives: GPUPrimitive[]
    ) {
    }

    buildRenderPipeline(
        device: GPUDevice,
        shaderModule: GPUShaderModule,
        colorFormat: GPUTextureFormat,
        depthFormat: GPUTextureFormat,
        uniformsBGLayout: GPUBindGroupLayout
    ) {
        // We take a pretty simple approach to start. Just loop through all the primitives and
        // build their respective render pipelines
        for (let i = 0; i < this.primitives.length; ++i) {
            this.primitives[i].buildRenderPipeline(device,
                shaderModule,
                colorFormat,
                depthFormat,
                uniformsBGLayout);
        }
    }

    render(renderPassEncoder: GPURenderPassEncoder, uniformsBG: GPUBindGroup) {
        // We take a pretty simple approach to start. Just loop through all the primitives and
        // call their individual draw methods
        for (let i = 0; i < this.primitives.length; ++i) {
            this.primitives[i].render(renderPassEncoder, uniformsBG);
        }
    }
}

