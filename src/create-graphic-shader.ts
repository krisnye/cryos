import { InternalDrawCommand } from "./create-context.js";
import { createVertexBuffer } from "./create-vertex-buffer.js";
import { createBindGroupHelper } from "./functions/create-bind-group-helper.js";
import { toBindGroupLayoutDescriptor } from "./functions/to-bind-group-layout-descriptor.js";
import { toGPUVertexBufferLayout } from "./functions/to-gpu-vertex-buffer-layout.js";
import { toShaderHeaderInputs } from "./functions/to-shader-header-inputs.js";
import { GraphicShader } from "./types/context-types.js";
import { GraphicShaderDescriptor, ShaderVertexBuffer } from "./types/shader-types.js";

export function createGraphicShader<T extends GraphicShaderDescriptor>(
    { device, targetFormat, shaderName, descriptor }: {
        device: GPUDevice;
        targetFormat: GPUTextureFormat;
        shaderName: string;
        descriptor: T;
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
