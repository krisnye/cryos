import { Database, scheduler } from "@adobe/data/ecs";
import { Vec4 } from "@adobe/data/math";

async function getWebGPUDevice() {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error('No GPU adapter found');
    }

    const device = await adapter.requestDevice();
    return device;
}

export const graphics = Database.Plugin.create({
    resources: {
        device: { default: null as GPUDevice | null, transient: true },
        commandEncoder: { default: null as GPUCommandEncoder | null, transient: true },
        renderPassEncoder: { default: null as GPURenderPassEncoder | null, transient: true },
        depthTexture: { default: null as GPUTexture | null, transient: true },
        clearColor: { default: [0, 0, 0, 1] as Vec4, transient: true },
        canvas: { default: null as HTMLCanvasElement | null, transient: true },
        canvasContext: { default: null as GPUCanvasContext | null, transient: true },
    },
    systems: {
        input: {
            create: db => () => {}
        },
        preUpdate: {
            create: db => () => {
                const { device } = db.store.resources;
                if (device) {
                    db.store.resources.commandEncoder = device.createCommandEncoder();
                    let { canvas, canvasContext } = db.store.resources;
                    if (canvas && !canvasContext) {
                        canvasContext = db.store.resources.canvasContext = canvas.getContext('webgpu');
                        if (!canvasContext) {
                            throw new Error('No WebGPU context');
                        }
                        canvasContext.configure({
                            device,
                            format: navigator.gpu.getPreferredCanvasFormat(),
                            alphaMode: 'premultiplied',
                        });
                    }
                }
            },
            schedule: { after: ["input"] }
        },
        update: {
            create: db => () => {},
            schedule: { after: ["preUpdate"] }
        },
        postUpdate: {
            create: db => () => {},
            schedule: { after: ["update"] }
        },
        physics: {
            create: db => () => {},
            schedule: { after: ["postUpdate"] }
        },
        preRender: {
            create: db => () => {
                let { canvas, commandEncoder, clearColor, canvasContext, device, depthTexture } = db.store.resources;
                if (!commandEncoder || !canvasContext || !device || !canvas) return;
                if (!depthTexture) {
                    depthTexture = db.store.resources.depthTexture = device.createTexture({
                        size: [canvas.width, canvas.height],
                        format: 'depth24plus',
                        usage: GPUTextureUsage.RENDER_ATTACHMENT
                    });
                }
                db.store.resources.renderPassEncoder = commandEncoder.beginRenderPass({
                    colorAttachments: [{
                        clearValue: clearColor,
                        loadOp: 'clear',
                        storeOp: 'store',
                        view: canvasContext.getCurrentTexture().createView(),
                    }],
                    depthStencilAttachment: {
                        view: depthTexture.createView(),
                        depthClearValue: 1.0,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                    }
                });
            },
            schedule: {
                after: ["physics"]
            }
        },
        render: {
            create: db =>  {
                getWebGPUDevice().then(device => {
                    db.store.resources.device = device;
                });
                return () => {
                }
            },
            schedule: { after: ["preRender"] }
        },
        postRender: {
            create: db => () => {
                const { commandEncoder, renderPassEncoder } = db.store.resources;
                if (renderPassEncoder) {
                    renderPassEncoder.end();
                    db.store.resources.renderPassEncoder = null;
                }
                if (commandEncoder) {
                    commandEncoder.finish();
                    db.store.resources.commandEncoder = null;
                }
            },
            schedule: { after: ["render"] }
        }
    },
    extends: scheduler
})
