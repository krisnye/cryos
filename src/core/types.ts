
export type WGSLType = "bool" | "i32" | "u32" | "f32" | "f16"
export type GPUVertexAttributeNamed = GPUVertexAttribute & { name: string }
export type GPUVertexBufferLayoutNamed = GPUVertexBufferLayout & { attributes: GPUVertexAttributeNamed[] }

export interface GPUEncoderContext {
    command: GPUCommandEncoder
    renderPass: GPURenderPassEncoder
}

export interface GPURenderPipelineProperties {
    layout?: Record<string, GPUBindGroupLayoutEntry[]>
    vertexInput: GPUVertexBufferLayoutNamed
    shader: string
    vertexMain?: string
    fragmentMain?: string
}

export type GPURenderPipelineAndMeta = GPURenderPipeline & {
    descriptor: GPURenderPipelineDescriptor
    properties: GPURenderPipelineProperties
}

export interface GPUContext<RP extends string = never> {
    canvas: HTMLCanvasElement
    device: GPUDevice
    canvasContext: GPUCanvasContext
    depthTexture: GPUTexture
    renderPipelines: Record<RP, GPURenderPipelineAndMeta>
}
