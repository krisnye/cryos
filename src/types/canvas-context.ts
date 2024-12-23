
export interface CanvasContext {
    readonly adapter: GPUAdapter
    readonly device: GPUDevice
    readonly element: HTMLCanvasElement
    readonly configuration: GPUCanvasConfiguration
    readonly context: GPUCanvasContext
    readonly depthStencil?: GPUTexture
}
