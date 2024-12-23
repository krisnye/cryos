import { ComputeCommand, ComputeShader, ComputeShaderDescriptor, Context, DrawCommand, GraphicShader, GraphicShaderDescriptor, isComputeCommand, isDrawCommand, ShaderResourceValues, ShaderUniformValues } from "./types/index.js";
import { BindGroupHelper } from "./functions/create-bind-group-helper.js";
import { createGraphicShader } from "./create-graphic-shader.js";
import { createCanvasContext } from "./functions/create-canvas-context.js";

export interface InternalDrawCommand<G extends GraphicShaderDescriptor> extends DrawCommand<G> {
    bindGroupHelper: BindGroupHelper<G>;
    renderPipeline: GPURenderPipeline;
}

export async function createContext(canvas: HTMLCanvasElement): Promise<Context> {
    const canvasContext = await createCanvasContext(canvas);

    const shaders: { [K: string]: GraphicShader<GraphicShaderDescriptor> | ComputeShader<ComputeShaderDescriptor> } = {};
    const withGraphicShaders = <S extends Record<string, GraphicShaderDescriptor>>(newShaders: S) => {
        Object.assign(
            shaders,
            Object.fromEntries(
                Object.entries(newShaders).map(([shaderName, descriptor]) => {
                    return [shaderName, createGraphicShader({ device: canvasContext.device, targetFormat: canvasContext.configuration.format, shaderName, descriptor })];
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
        const encoder = canvasContext.device.createCommandEncoder();

        // Start render pass
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: canvasContext.context.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
                clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }],
            depthStencilAttachment: {
                view: canvasContext.depthStencil!.createView(),
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
                const { bindGroupHelper, renderPipeline, vertexBuffer, vertexCount, instanceCount } = command as InternalDrawCommand<any>;
                bindGroupHelper.maybeWriteToGPU();
                renderPass.setPipeline(renderPipeline);
                renderPass.setBindGroup(0, bindGroupHelper.getBindGroup());
                renderPass.setVertexBuffer(0, vertexBuffer ?? null);
                renderPass.draw(vertexCount, instanceCount ?? 1);
            }
        }

        renderPass.end();
        canvasContext.device.queue.submit([encoder.finish()]);
        return await canvasContext.device.queue.onSubmittedWorkDone();
    };

    const context: Context = {
        ...canvasContext,
        shaders,
        createStorageBuffer: () => {
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
