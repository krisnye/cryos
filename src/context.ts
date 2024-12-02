import { createVertexBuffer } from "./vertex-buffer.js";
import { ComputeCommand, ComputeShader, ComputeShaderDescriptor, Context, DrawCommand, GraphicShader, GraphicShaderDescriptor, isComputeCommand, isDrawCommand } from "./types/index.js";

export async function createContext(canvas: HTMLCanvasElement): Promise<Context> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error(`Could not get a webgpu adapter`);
    }
    const device = await adapter.requestDevice();

    const canvasContext = canvas.getContext("webgpu");
    if (!canvasContext) {
        throw new Error(`Could not get a webgpu context`);
    }

    const depthTexture = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
            depthOrArrayLayers: 1   //  was depth
        },
        format: "depth24plus-stencil8",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    // Setup render outputs
    canvasContext.configure({
        device,
        format: "bgra8unorm",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const shaders: { [K: string]: GraphicShader<GraphicShaderDescriptor> | ComputeShader<ComputeShaderDescriptor> } = {};

    const withGraphicShaders = <S extends Record<string, GraphicShaderDescriptor>>(newShaders: S) => {
        Object.assign(
            shaders,
            Object.fromEntries(
                Object.entries(newShaders).map(([shaderName, descriptor]) => {
                    const shader = {
                        descriptor,
                        draw: (resources, vertexBuffer, vertexCount, instanceCount) => {
                            return { shaderName, resources, vertexBuffer, vertexCount, instanceCount };
                        },
                        createVertexBuffer: (data) => {
                            return createVertexBuffer(device, descriptor.vertex.attributes, data);
                        }
                    } satisfies GraphicShader<GraphicShaderDescriptor>;
                    return [ shaderName, shader ];
                })
            )
        );
        return context as any;
    };

    /**
     * Internally this will create a command encoder, encode the commands, and submit them.
     * The binding elements layouts will be created and updated as needed, just one binding elements layout per shader.
     */
    const executeCommands = async (commands: (ComputeCommand<ComputeShaderDescriptor> | DrawCommand<GraphicShaderDescriptor>)[]): Promise<void> => {
        const encoder = device.createCommandEncoder();
        
        // Start render pass
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: canvasContext.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
                clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthLoadOp: "clear",
                depthStoreOp: "store",
                depthClearValue: 1.0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store",
                stencilClearValue: 0,
            }
        });

        for (const command of commands) {
            if (isComputeCommand(command)) {
                const shader = shaders[command.shaderName] as ComputeShader<ComputeShaderDescriptor>;
                throw new Error("Not implemented");
            } else if (isDrawCommand(command)) {
                const shader = shaders[command.shaderName] as GraphicShader<GraphicShaderDescriptor>;
                const { descriptor } = shader;
                const { vertexBuffer, vertexCount, instanceCount, resources } = command;

                // renderPass.setPipeline(pipeline);
                // renderPass.setBindGroup(0, bindGroup);
                // renderPass.setVertexBuffer(0, vertexBuffer as any);
                // renderPass.draw(vertexCount, instanceCount || 1);
            }
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    };

    const context: Context = {
        canvas,
        canvasContext,
        device,
        depthTexture,
        shaders,
        createStorageBuffer: () => {
            throw new Error("Not implemented");
        },
        createTexture: () => {
            throw new Error("Not implemented");
        },
        withGraphicShaders,
        withComputeShaders: () => {
            throw new Error("Not implemented");
        },
        executeCommands
    };

    return context;
}
