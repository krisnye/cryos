
export interface CanvasContext {
    readonly adapter: GPUAdapter
    readonly device: GPUDevice
    readonly canvas: {
        readonly configuration: GPUCanvasConfiguration
        readonly context: GPUCanvasContext
    }
    readonly depthStencil?: GPUTexture
}
