import { createCustomElement, html, useConnected } from "lithos";
import { createGPUContext, createRenderFunction as createEncoderFunction, createStaticVertexBuffer, toWGSLStructBody, copyToBuffer } from "../core/functions.js";
import { GPURenderPipelineProperties } from "../core/types.js";
import { positionColor } from "../core/vertexFormats.js";
import { uploadGLB } from "../core/glb.js";

const triangleShader: GPURenderPipelineProperties = {
    layout: {
        view_params: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }]
    },
    vertexInput: positionColor,
    shader: /* wgsl */ `
alias float4 = vec4<f32>;
alias float3 = vec3<f32>;

struct VertexInput {
    @location(0) position: float3,
};

struct VertexOutput {
    @builtin(position) position: float4,
    @location(0) world_pos: float3,
};

struct ViewParams {
    view_proj: mat4x4<f32>,
};

@group(0) @binding(0)
var<uniform> view_params: ViewParams;

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = view_params.view_proj * float4(vert.position, 1.0);
    out.world_pos = vert.position.xyz;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    let dx = dpdx(in.world_pos);
    let dy = dpdy(in.world_pos);
    let n = normalize(cross(dx, dy));
    return float4((n + 1.0) * 0.5, 1.0);
}
`
}

export const GLTFMesh = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let context = await createGPUContext(this, { defaultShader: triangleShader })

            const vertexBuffer = createStaticVertexBuffer(
                context.device,
                triangleShader.vertexInput,
                [
                    1, -1, 0, 1,  // 0 position
                    1, 0, 0, 1,   // 0 color
                    -1, -1, 0, 1, // 1 position
                    0, 1, 0, 1,   // 1 color
                    0, 1, 0, 1,   // 2 position
                    0, 0, 1, 1,   // 2 color
                ]
            )

            //  TODO: Still could use some easier abstraction for setting bind group properties, maybe well typed.
            //  Maybe wait until we have more resource types to simplify this.

            // Create a buffer to store the view parameters
            const viewParamsBuffer = context.device.createBuffer({
                size: 16 * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })

            // Create a bind group which places our view params buffer at binding 0
            const viewParamBG = context.device.createBindGroup({
                layout: context.renderPipelines.defaultShader.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: viewParamsBuffer } }]
            })

            // TODO: Use a camera to create this view.
            const s = 20
            const viewProjMatrix = [
                s, 0, 0, 0,
                0, s, 0, 0,
                0, 0, s, 0,
                0, -0.5, 0, 1,
            ]

            // load glb
            const buffer = await (await fetch("./avocado.glb")).arrayBuffer()
            let glbMesh = uploadGLB(buffer, context.device)

            glbMesh.buildRenderPipeline(context.device,
                context.renderPipelines.defaultShader.descriptor.vertex.module,
                context.canvasContext.getCurrentTexture().format,
                context.depthTexture.format,
                context.renderPipelines.defaultShader.getBindGroupLayout(0)
            )

            const frame = createEncoderFunction(context, (encoder, renderPassDescriptor) => {
                copyToBuffer(context.device, encoder, viewProjMatrix, viewParamsBuffer)
                const renderPass = encoder.beginRenderPass(renderPassDescriptor)

                // Render our mesh!
                glbMesh.render(renderPass, viewParamBG);

                renderPass.end()
            })

            requestAnimationFrame(frame)
        })()
    })

    return html.Canvas({
        width: 320, height: 240,
        style: { border: "solid 1px black", background: "beige" }
    })
}, { extends: "canvas" })
