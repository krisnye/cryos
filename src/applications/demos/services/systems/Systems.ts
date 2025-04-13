
export type Systems = {
    name: string,
    update?: (commandEncoder: GPUCommandEncoder) => void,
    render?: (renderPassEncoder: GPURenderPassEncoder) => void,
}