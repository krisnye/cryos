import { GPUContext, GPUShaderDescriptor, GPUVertexAttributeNamed, GPUVertexBufferLayoutNamed, WGSLType } from "./types.js"

const vertexFormatToSize = {
    uint8x2: 2, uint8x4: 4,
    sint8x2: 2, sint8x4: 4,
    unorm8x2: 2, unorm8x4: 4, snorm8x2: 2, snorm8x4: 4,
    uint16x2: 4, uint16x4: 8, sint16x2: 4, sint16x4: 8,
    unorm16x2: 4, unorm16x4: 8, snorm16x2: 4, snorm16x4: 8,
    float16x2: 4, float16x4: 8,
    float32: 4, float32x2: 8, float32x3: 12, float32x4: 16,
    uint32: 4, uint32x2: 8, uint32x3: 12, uint32x4: 16,
    sint32: 4, sint32x2: 8, sint32x3: 12, sint32x4: 16,
} as const satisfies Record<GPUVertexFormat, number>

const vertexFormatToCount = {
    uint8x2: 2, uint8x4: 4,
    sint8x2: 2, sint8x4: 4,
    unorm8x2: 2, unorm8x4: 4, snorm8x2: 2, snorm8x4: 4,
    uint16x2: 2, uint16x4: 4, sint16x2: 2, sint16x4: 4,
    unorm16x2: 2, unorm16x4: 4, snorm16x2: 2, snorm16x4: 4,
    float16x2: 2, float16x4: 4,
    float32: 1, float32x2: 2, float32x3: 3, float32x4: 4,
    uint32: 1, uint32x2: 2, uint32x3: 3, uint32x4: 4,
    sint32: 1, sint32x2: 2, sint32x3: 3, sint32x4: 4,
} as const satisfies Record<GPUVertexFormat, number>

const vertexFormatToWGSLType = {
    uint8x2: "u32", uint8x4: "u32",
    sint8x2: "i32", sint8x4: "i32",
    unorm8x2: "u32", unorm8x4: "u32", snorm8x2: "u32", snorm8x4: "u32",     //  ?
    uint16x2: "u32", uint16x4: "u32", sint16x2: "u32", sint16x4: "u32",     //  ?
    unorm16x2: "u32", unorm16x4: "u32", snorm16x2: "u32", snorm16x4: "u32", //  ?
    float16x2: "f16", float16x4: "f16",
    float32: "f32", float32x2: "f32", float32x3: "f32", float32x4: "f32",
    uint32: "u32", uint32x2: "u32", uint32x3: "u32", uint32x4: "u32",
    sint32: "i32", sint32x2: "i32", sint32x3: "i32", sint32x4: "i32",
} as const satisfies Record<GPUVertexFormat, WGSLType>

export function toWGSLType(format: GPUVertexFormat): string {
    const count = vertexFormatToCount[format]
    const scalarType = vertexFormatToWGSLType[format]
    if (count === 1) {
        return scalarType
    }
    else {
        const vectorType = `vec${count}<${scalarType}>`
        return vectorType
    }
}

export function toWGSLStructBody(vertexBufferLayout: GPUVertexBufferLayoutNamed) {
    return `{\n${vertexBufferLayout.attributes.map((value, index) => `    @location(${index}) ${value.name}: ${toWGSLType(value.format)},\n`).join(``)}}\n`
}

export async function requestGPUDevice(): Promise<GPUDevice> {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        throw new Error()
    }
    const device = await adapter.requestDevice()
    return device
}

export async function compileGPUShaderModule(device: GPUDevice, code: string): Promise<GPUShaderModule> {
    const shaderModule = device.createShaderModule({ code })
    const compilationInfo = await shaderModule.getCompilationInfo()
    if (compilationInfo.messages.length > 0) {
        let hadError = false
        let messages: string[] = []
        // console.log("Shader compilation log:");
        for (let i = 0; i < compilationInfo.messages.length; i++) {
            const msg = compilationInfo.messages[i]
            messages.push(`${msg.lineNum}:${msg.linePos} - ${msg.message}`)
            hadError ||= msg.type == "error"
        }
        throw new Error(`Shader Compilation ${hadError ? "Error" : "Warning"}:\n${messages.join("\n")}`)
    }
    return shaderModule
}

export function createVertexBufferLayoutNamed(properties: Record<string, GPUVertexFormat>): GPUVertexBufferLayoutNamed {

    let arrayStride = 0
    let attributes: GPUVertexAttributeNamed[] = []
    for (let [name, format] of Object.entries(properties)) {
        attributes.push({ format, offset: arrayStride, shaderLocation: attributes.length, name })
        let size = vertexFormatToSize[format]
        arrayStride += size
    }

    return { arrayStride, attributes }
}

export function createStaticVertexBuffer(device: GPUDevice, vertexBufferLayout: GPUVertexBufferLayoutNamed, data: number[], usage = GPUBufferUsage.VERTEX) {
    const sizePerElement = 4 // for now assume numbers are floats
    const expectedElementMultiple = vertexBufferLayout.arrayStride / sizePerElement
    if (data.length % expectedElementMultiple !== 0) {
        throw new Error(`Unexpected data length: ${data.length}, expected multiple of ${expectedElementMultiple}`)
    }
    const buffer = device.createBuffer({
        size: data.length * sizePerElement,
        usage,
        mappedAtCreation: true
    })

    // Interleaved positions and colors
    new Float32Array(buffer.getMappedRange()).set(data)
    buffer.unmap()
    return buffer
}

export async function createGPUContext<Shaders extends string>(canvas: HTMLCanvasElement, shaders: Record<Shaders, GPUShaderDescriptor>): Promise<GPUContext<Shaders>> {
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
    });

    // Setup render outputs
    canvasContext.configure({
        device,
        format: "bgra8unorm",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const c = { canvas, canvasContext, device, depthTexture, renderPipelines: {} }

    const renderPipelines: Record<Shaders, GPURenderPipeline> = {} as Record<Shaders, GPURenderPipeline>
    for (let [name, shader] of Object.entries(shaders)) {
        renderPipelines[name] = await createRenderPipeline(c, shader as GPUShaderDescriptor)
    }

    return { ...c, renderPipelines }
}

export function addRenderPipeline<RP extends string, Name extends string>(
    c: GPUContext<RP>, name: Name, renderPipeline: GPURenderPipeline
): GPUContext<RP | Name> {
    return { ...c, renderPipelines: { ...c.renderPipelines, [name]: renderPipeline } } as GPUContext<RP | Name>
}

export async function createRenderPipeline(
    c: GPUContext,
    shaderDescriptor: GPUShaderDescriptor
) {
    const { vertexInput: vertexLayout, shader, vertexMain = "vertex_main", fragmentMain = "fragment_main" } = shaderDescriptor
    const shaderModule = await compileGPUShaderModule(c.device, shader);

    const renderPipeline = c.device.createRenderPipeline({
        layout: c.device.createPipelineLayout({ bindGroupLayouts: [] }),
        vertex: {
            module: shaderModule, entryPoint: vertexMain, buffers: [vertexLayout]
        },
        fragment: {
            module: shaderModule, entryPoint: fragmentMain,
            targets: [{ format: c.canvasContext.getCurrentTexture().format }]
        },
        depthStencil: { format: c.depthTexture.format, depthWriteEnabled: true, depthCompare: "less" }
    });

    return renderPipeline

}

export function createRenderFunction(c: GPUContext, callback: (renderPass: GPURenderPassEncoder) => void) {
    const renderPassDesc = {
        colorAttachments: [{
            // view will be set to the current render target each frame
            view: undefined as unknown as GPUTextureView,
            loadOp: "clear", storeOp: "store"
        }],
        depthStencilAttachment: {
            view: c.depthTexture.createView(),
            depthLoadOp: "clear", depthClearValue: 1.0, depthStoreOp: "store",
            stencilLoadOp: "clear", stencilClearValue: 0, stencilStoreOp: "store"
        }
    } satisfies GPURenderPassDescriptor;

    return function () {
        renderPassDesc.colorAttachments[0].view = c.canvasContext.getCurrentTexture().createView();
        const commandEncoder = c.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDesc);
        callback(renderPass)
        renderPass.end();
        c.device.queue.submit([commandEncoder.finish()]);
    };
}