import { Matrix4 } from "../math/Matrix4.js"
import { Vector4 } from "../math/Vector4.js"
import { GPUUniformEntryHelper } from "./GPUUniformEntryHelper.js"
import { compileGPUShaderModule, requestGPUDevice } from "./functions.js"
import { GPURenderPipelineAndMeta, GPURenderPipelineProperties, GPUVertexBufferLayoutNamed, UniformBindings, UniformValues, WGSLType } from "./types.js"

export const cameraBindings = { viewProjection: "mat4x4", position: "vec4", } as const satisfies UniformBindings
export const cameraLayout = { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } } satisfies GPUBindGroupLayoutEntry

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
    public readonly camera: GPUUniformEntryHelper<typeof cameraBindings>

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
        this.camera = this.createUniformHelper(
            cameraLayout,
            cameraBindings,
            { viewProjection: Matrix4.identity, position: Vector4.zero }
        )
    }

    public destroy() {
        // this.canvasContext.unconfigure()
        this.device.destroy()
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
                depthLoadOp: "clear",
                depthStoreOp: "store",
                depthClearValue: 1.0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store",
                stencilClearValue: 0,
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
            for (let buffer of this.borrowedBuffers) {
                buffer.destroy()
            }
            this.borrowedBuffers.length = 0
        })
        return onSubmittedWorkDone
    }

    private borrowedBuffers: GPUBuffer[] = []
    public borrowUploadBuffer(minSize: number): GPUBuffer {
        const buffer = this.device.createBuffer(
            { size: minSize, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true }
        )
        this.borrowedBuffers.push(buffer)
        return buffer
    }

    public borrowDownloadBuffer(device: GPUDevice, minSize: number) {
        const buffer = device.createBuffer({
            size: minSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        this.borrowedBuffers.push(buffer)
        return buffer
    }

    /**
     * Creates a new uniform helper that provides it's own buffer, copying and type checking.
     */
    public createUniformHelper<Bindings extends UniformBindings>(
        layout: GPUBindGroupLayoutEntry,
        bindings: Bindings,
        values?: UniformValues<Bindings>
    ): GPUUniformEntryHelper<Bindings> {
        return new GPUUniformEntryHelper<Bindings>(this, layout, bindings, values)
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
        const bindGroupLayouts = properties.layout ? properties.layout.map(
            (entries) => this.device.createBindGroupLayout({ entries })
        ) : []

        type Foo = GPUBlendComponent

        const descriptor = {
            layout: this.device.createPipelineLayout({ bindGroupLayouts }),
            vertex: {
                module: shaderModule, entryPoint: vertexMain, buffers: [vertexLayout]
            },
            fragment: {
                module: shaderModule, entryPoint: fragmentMain,
                targets: [{
                    format: this.canvasContext.getCurrentTexture().format,
                    // blend: {
                    //     alpha: {
                    //         operation: "add",
                    //         srcFactor: "src-alpha",
                    //         dstFactor: "one-minus-src-alpha"
                    //     },
                    //     color: {
                    //         operation: "add",
                    //         srcFactor: "src-alpha",
                    //         dstFactor: "one-minus-src-alpha"
                    //     }
                    // }
                }],
            },
            primitive: {
                cullMode: "none"    //  for now
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

