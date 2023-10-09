import { compileGPUShaderModule, requestGPUDevice } from "./functions.js"
import { GPURenderPipelineAndMeta, GPURenderPipelineProperties, GPUVertexBufferLayoutNamed } from "./types.js"

enum State {
    default = 0,
    command = 1,
    render = 2
}

export class GPUContext {

    public readonly canvas: HTMLCanvasElement
    public readonly device: GPUDevice
    public readonly canvasContext: GPUCanvasContext
    public readonly depthTexture: GPUTexture
    private _commandEncoder?: GPUCommandEncoder
    private _renderPassEncoder?: GPURenderPassEncoder

    private constructor({ canvas, canvasContext, device, depthTexture }: {
        canvas: HTMLCanvasElement
        device: GPUDevice
        canvasContext: GPUCanvasContext
        depthTexture: GPUTexture
    }) {
        this.canvas = canvas
        this.device = device
        this.canvasContext = canvasContext
        this.depthTexture = depthTexture
    }

    private get state() {
        return this._renderPassEncoder ? State.render : this._commandEncoder ? State.command : State.default
    }

    private assertState(state: State) {
        if (state !== this.state) {
            throw new Error("Invalid state")
        }
    }

    public get command(): GPUCommandEncoder {
        this.assertState(State.command)
        return this._commandEncoder!
    }

    public get render(): GPURenderPassEncoder {
        this.assertState(State.render)
        return this._renderPassEncoder!
    }

    public beginCommands() {
        this._commandEncoder = this.device.createCommandEncoder()
    }
    public beginRenderPass() {
        this._renderPassEncoder = this._commandEncoder!.beginRenderPass({
            colorAttachments: [{
                view: this.canvasContext.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthLoadOp: "clear", depthClearValue: 1.0, depthStoreOp: "store",
                stencilLoadOp: "clear", stencilClearValue: 0, stencilStoreOp: "store"
            }
        })
    }
    public endRenderPass() {
        this.assertState(State.render)
        this._renderPassEncoder!.end()
        this._renderPassEncoder = undefined
    }
    public endCommands(): Promise<void> {
        this.assertState(State.command)
        this.device.queue.submit([this._commandEncoder!.finish()])
        const onSubmittedWorkDone = this.device.queue.onSubmittedWorkDone()
        onSubmittedWorkDone.then(() => {
            for (let buffer of this.borrowedUploadBuffers) {
                this.returnUploadBuffer(buffer)
            }
            this.borrowedUploadBuffers.length = 0
        })
        return onSubmittedWorkDone
    }

    private borrowedUploadBuffers: GPUBuffer[] = []
    private createUploadBuffer(minSize: number): GPUBuffer {
        return this.device.createBuffer(
            { size: minSize, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true }
        )
    }
    private borrowUploadBuffer(minSize: number): GPUBuffer {
        const buffer = this.createUploadBuffer(minSize)
        this.borrowedUploadBuffers.push(buffer)
        return buffer
    }

    private returnUploadBuffer(buffer: GPUBuffer) {
        buffer.destroy()
    }

    /**
     * Queues a command to copy the data to the buffer
     * The intermediate upload buffer used will be automatically recycled when the command queue finishes.
     */
    commandCopyToBuffer(data: ArrayLike<number>, buffer: GPUBuffer) {
        this.assertState(State.command)
        const size = data.length * 4
        const upload = this.borrowUploadBuffer(size)
        var map = new Float32Array(upload.getMappedRange(0, size))
        map.set(data)
        upload.unmap()
        this._commandEncoder!.copyBufferToBuffer(upload, 0, buffer, 0, size)
    }

    async createRenderPipeline(
        properties: GPURenderPipelineProperties
    ): Promise<GPURenderPipelineAndMeta> {
        const { vertexInput: vertexLayout, shader, vertexMain = "vertex_main", fragmentMain = "fragment_main" } = properties
        const shaderModule = await compileGPUShaderModule(this.device, shader)
        const bindGroupLayouts = properties.layout ? Object.entries(properties.layout).map(
            ([label, entries]) => this.device.createBindGroupLayout({ label, entries })
        ) : []

        const descriptor = {
            layout: this.device.createPipelineLayout({ bindGroupLayouts }),
            vertex: {
                module: shaderModule, entryPoint: vertexMain, buffers: [vertexLayout]
            },
            fragment: {
                module: shaderModule, entryPoint: fragmentMain,
                targets: [{ format: this.canvasContext.getCurrentTexture().format }]
            },
            depthStencil: { format: this.depthTexture.format, depthWriteEnabled: true, depthCompare: "less" }
        } as const satisfies GPURenderPipelineDescriptor
        const renderPipeline = this.device.createRenderPipeline(descriptor)
        return Object.assign(renderPipeline, { descriptor, properties })
    }

    createStaticVertexBuffer(vertexBufferLayout: GPUVertexBufferLayoutNamed, data: number[], usage = GPUBufferUsage.VERTEX) {
        const sizePerElement = 4 // for now assume numbers are floats
        const expectedElementMultiple = vertexBufferLayout.arrayStride / sizePerElement
        if (data.length % expectedElementMultiple !== 0) {
            throw new Error(`Unexpected data length: ${data.length}, expected multiple of ${expectedElementMultiple}`)
        }
        const buffer = this.device.createBuffer({
            size: data.length * sizePerElement,
            usage,
            mappedAtCreation: true
        })

        // Interleaved positions and colors
        new Float32Array(buffer.getMappedRange()).set(data)
        buffer.unmap()
        return buffer
    }

    public static async create(
        canvas: HTMLCanvasElement
    ): Promise<GPUContext> {
        const device = await requestGPUDevice()
        const canvasContext = canvas.getContext("webgpu")
        if (!canvasContext) {
            throw new Error(`Could not get a webgpu context`)
        }

        const depthTexture = device.createTexture({
            size: {
                width: canvas.width,
                height: canvas.height,
                depthOrArrayLayers: 1   //  was depth
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })
        // Setup render outputs
        canvasContext.configure({
            device,
            format: "bgra8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })
        return new GPUContext({ canvas, canvasContext, device, depthTexture })
    }
}

