import { CanvasContext } from "../types/canvas-context.js";

export async function createCanvasContext(
    canvas: HTMLCanvasElement,
    options: {
        depthStencilFormat?: GPUTextureFormat
    } = {
        depthStencilFormat: "depth24plus-stencil8"
    }
): Promise<CanvasContext> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error(`Could not get a webgpu adapter`);
    }
    const device = await adapter.requestDevice();
    const canvasContext = canvas.getContext("webgpu");
    if (!canvasContext) {
        throw new Error(`Could not get a webgpu context`);
    }

    const configuration: GPUCanvasConfiguration = {
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    };
    canvasContext.configure(configuration);

    const depthStencil = options.depthStencilFormat ? device.createTexture({
        size: [canvas.width, canvas.height],
        format: options.depthStencilFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    }) : undefined;

    return {
        adapter,
        device,
        element: canvas,
        context: canvasContext,
        configuration,
        depthStencil
    }
}