
export type WGSLType = "bool" | "i32" | "u32" | "f32" | "f16"
export type GPUVertexAttributeNamed = GPUVertexAttribute & { name: string }
export type GPUVertexBufferLayoutNamed = GPUVertexBufferLayout & { attributes: GPUVertexAttributeNamed[] }

export interface GPUShaderDescriptor {
    vertexInput: GPUVertexBufferLayoutNamed
    shader: string
    vertexMain?: string
    fragmentMain?: string
}

export interface GPUContext<Shaders extends string = never> {
    canvas: HTMLCanvasElement
    device: GPUDevice
    canvasContext: GPUCanvasContext
    depthTexture: GPUTexture
    renderPipelines: Record<Shaders, GPURenderPipeline>
}
