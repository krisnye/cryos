import { createVertexBuffer } from "./create-vertex-buffer.js";
import { createBindGroupHelper } from "./functions/create-bind-group-helper.js";
import { toBindGroupLayoutDescriptor } from "./functions/to-bind-group-layout-descriptor.js";
import { toGPUVertexBufferLayout } from "./functions/to-gpu-vertex-buffer-layout.js";
import { toShaderHeaderInputs } from "./functions/to-shader-header-inputs.js";
import { CanvasContext } from "./types/canvas-context.js";
import { EmptyToNever, Mutable, Resource, VertexAttributes } from "./types/index.js";
import { Renderable } from "./types/renderable.js";
import { GraphicShaderDescriptor, ShaderResourceValues, ShaderUniformValues, ShaderVertexBuffer } from "./types/shader-types.js";

export interface DrawCommand<G extends GraphicShaderDescriptor> extends Resource, Renderable {
    /**
     * Individual uniforms can be written to.
     */
    readonly uniforms: Mutable<ShaderUniformValues<G>>;
    /**
     * Individual resources can be written to.
     */
    readonly resources: Mutable<ShaderResourceValues<G>>;
    vertexCount: number;
    vertexBuffer?: ShaderVertexBuffer<G>;
    instanceCount?: number;
}

export type GraphicShader<G extends GraphicShaderDescriptor> = {
    descriptor: G,
    draw: (
        props: {
            uniforms?: EmptyToNever<ShaderUniformValues<G>>,
            resources?: EmptyToNever<ShaderResourceValues<G>>,
            vertexBuffer?: ShaderVertexBuffer<G>,
            vertexCount: number,
            instanceCount?: number
        }
    ) => DrawCommand<G>,
    createVertexBuffer: G["attributes"] extends VertexAttributes ? (data: number[]) => ShaderVertexBuffer<G> : undefined;
};

export function createGraphicShader<T extends GraphicShaderDescriptor>(
    context: CanvasContext,
    descriptor: T
): GraphicShader<T> {
    const code = toShaderHeaderInputs(descriptor) + descriptor.source;
    const vertexBufferLayout = descriptor.attributes ? toGPUVertexBufferLayout(descriptor.attributes) : undefined;
    const module = context.device.createShaderModule({ code });
    const bindGroupLayout = context.device.createBindGroupLayout(toBindGroupLayoutDescriptor(descriptor));
    const layout = context.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });
    const renderPipeline = context.device.createRenderPipeline({
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
                    format: context.configuration.format,
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
            const bindGroupHelper = createBindGroupHelper(context.device, descriptor, props.uniforms as any, props.resources as any);
            return {
                uniforms: bindGroupHelper.uniforms,
                resources: bindGroupHelper.resources,
                vertexBuffer: props.vertexBuffer,
                vertexCount: props.vertexCount,
                instanceCount: props.instanceCount,
                render: (renderPass) => {
                    bindGroupHelper.maybeWriteToGPU();
                    renderPass.setPipeline(renderPipeline);
                    renderPass.setBindGroup(0, bindGroupHelper.getBindGroup());
                    renderPass.setVertexBuffer(0, props.vertexBuffer ?? null);
                    renderPass.draw(props.vertexCount, props.instanceCount ?? 1);
                },
                destroy: () => {
                    bindGroupHelper.destroy();
                }
            } satisfies DrawCommand<T>;
        },
        createVertexBuffer: (descriptor.attributes ? (data) => {
            return createVertexBuffer(context.device, descriptor.attributes!, data) as ShaderVertexBuffer<T>;
        } : undefined) as any,
    } satisfies GraphicShader<T>;
    return shader;
}
