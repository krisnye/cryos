import { createVertexBuffer } from "./create-vertex-buffer.js";
import { toGPUVertexBufferLayout } from "./functions/index.js";
import { toBindGroupLayoutDescriptor } from "./functions/to-bind-group-layout-descriptor.js";
import { toShaderHeaderInputs } from "./functions/to-shader-header-inputs.js";
import { ComputeCommand, ComputeShader, ComputeShaderDescriptor, Context, DrawCommand, GraphicShader, GraphicShaderDescriptor, isComputeCommand, isDrawCommand, ShaderResourceValues, ShaderUniformValues, ShaderVertexBuffer } from "./types/index.js";
import { BindGroupHelper, createBindGroupHelper } from "./functions/create-bind-group-helper.js";
import { loadImageBitmap } from "./internal/core/functions.js";

interface InternalDrawCommand<G extends GraphicShaderDescriptor> extends DrawCommand<G> {
    bindGroupHelper: BindGroupHelper<G>;
    renderPipeline: GPURenderPipeline;
}

export function createGraphicShader<T extends GraphicShaderDescriptor>(
    { device, targetFormat, shaderName, descriptor }: {
        device: GPUDevice,
        targetFormat: GPUTextureFormat,
        shaderName: string,
        descriptor: T
    }
): GraphicShader<T> {
    const code = toShaderHeaderInputs(descriptor) + descriptor.source;
    const vertexBufferLayout = descriptor.attributes ? toGPUVertexBufferLayout(descriptor.attributes) : undefined;
    const module = device.createShaderModule({ code });
    const bindGroupLayout = device.createBindGroupLayout(toBindGroupLayoutDescriptor(descriptor));
    const layout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });
    const renderPipeline = device.createRenderPipeline({
        layout,
        vertex: {
            module,
            entryPoint: "vertex_main",
            buffers: vertexBufferLayout ? [vertexBufferLayout] : [],
        },
        fragment: {
            module,
            entryPoint: "fragment_main",
            targets: [
                {
                    format: targetFormat,
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
        },
        depthStencil: {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    const shader = {
        descriptor,
        draw: (props) => {
            const bindGroupHelper = createBindGroupHelper(device, descriptor, props.uniforms as any, props.resources as any);
            return {
                shaderName: shaderName,
                bindGroupHelper,
                uniforms: bindGroupHelper.uniforms,
                resources: bindGroupHelper.resources,
                renderPipeline,
                vertexBuffer: props.vertexBuffer,
                vertexCount: props.vertexCount,
                instanceCount: props.instanceCount,
                destroy: () => {
                    bindGroupHelper.destroy();
                }
            } satisfies InternalDrawCommand<T>;
        },
        createVertexBuffer: (descriptor.attributes ? (data) => {
            return createVertexBuffer(device, descriptor.attributes!, data) as ShaderVertexBuffer<T>;
        } : undefined) as any,
    } satisfies GraphicShader<T>;
    return shader;
}

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
    const targetFormat = "bgra8unorm";
    // Setup render outputs
    canvasContext.configure({
        device,
        format: targetFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const shaders: { [K: string]: GraphicShader<GraphicShaderDescriptor> | ComputeShader<ComputeShaderDescriptor> } = {};
    const withGraphicShaders = <S extends Record<string, GraphicShaderDescriptor>>(newShaders: S) => {
        Object.assign(
            shaders,
            Object.fromEntries(
                Object.entries(newShaders).map(([shaderName, descriptor]) => {
                    return [shaderName, createGraphicShader({ device, targetFormat, shaderName, descriptor })];
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
                const { bindGroupHelper, renderPipeline, vertexBuffer, vertexCount, instanceCount } = command as InternalDrawCommand<any>;
                bindGroupHelper.maybeWriteToGPU();
                renderPass.setPipeline(renderPipeline);
                renderPass.setBindGroup(0, bindGroupHelper.getBindGroup());
                renderPass.setVertexBuffer(0, vertexBuffer ?? null);
                renderPass.draw(vertexCount, instanceCount ?? 1);
            }
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
        return await device.queue.onSubmittedWorkDone();
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
        loadTexture: async (source) => {
            if (typeof source !== "string") {
                throw new Error("Not implemented");
            }
            const bitmap = await loadImageBitmap(source);
            const texture = device.createTexture({
                size: {
                    width: bitmap.width,
                    height: bitmap.height,
                    depthOrArrayLayers: 1
                },
                format: targetFormat,
                usage: GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST | 
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
                { source: bitmap, flipY: true },
                { texture },
                { width: bitmap.width, height: bitmap.height }
            );

            return texture;
        },
        withGraphicShaders,
        withComputeShaders: () => {
            throw new Error("Not implemented");
        },
        executeCommands
    };

    return context;
}
