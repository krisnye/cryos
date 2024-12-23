import { CanvasContext } from "../types/canvas-context.js";

export function beginRenderPass(context: CanvasContext, encoder: GPUCommandEncoder) {
    return encoder.beginRenderPass({
        colorAttachments: [{
            view: context.context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
        }],
        depthStencilAttachment: context.depthStencil ? {
            view: context.depthStencil.createView(),
            depthLoadOp: "clear",
            depthStoreOp: "store",
            depthClearValue: 1.0,
            stencilLoadOp: "clear",
            stencilStoreOp: "store",
            stencilClearValue: 0,
        } : undefined,
    });
}