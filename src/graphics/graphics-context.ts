
export type GraphicsContext = {
    readonly canvas: HTMLCanvasElement;
    readonly device: GPUDevice;
    readonly context: GPUCanvasContext;
}