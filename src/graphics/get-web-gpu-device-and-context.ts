import { GraphicsContext } from "./graphics-context.js";

export const getWebGPUGraphicsContext = async (canvas: HTMLCanvasElement)
: Promise<GraphicsContext> => {
    if (!canvas) {
        throw new Error('Canvas not found');
    }

    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error('No GPU adapter found');
    }

    const device = await adapter.requestDevice();

    const context = canvas.getContext('webgpu');
    if (!context) {
        throw new Error('No WebGPU context');
    }

    context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
    });
    return { context, device, canvas }
}