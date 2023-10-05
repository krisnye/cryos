import { createCustomElement, html, useConnected } from "lithos";
import { createGPUContext, createRenderFunction as createEncoderFunction, createStaticVertexBuffer, toWGSLStructBody, copyToBuffer } from "../core/functions.js";
import { GPURenderPipelineProperties } from "../core/types.js";
import { positionColor } from "../core/vertexFormats.js";

const defaultShader: GPURenderPipelineProperties = {
    layout: {
        view_params: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }]
    },
    vertexInput: positionColor,
    shader: /* wgsl */ `
alias float4 = vec4<f32>;
struct VertexInput ${toWGSLStructBody(positionColor)}

struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: float4,
    // We can pass other attributes through as well
    @location(0) color: float4,
};

// New: define a struct that contains the data we want to pass
// through the uniform buffer
struct ViewParams {
    view_proj: mat4x4<f32>,
};

// New: create a uniform variable of our struct type
// and assign it group and binding indices
@group(0) @binding(0)
var<uniform> view_params: ViewParams;

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    out.position = view_params.view_proj * vert.position;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}`
}

export const BindGroups = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let context = await createGPUContext(this, { defaultShader })

            const vertexBuffer = createStaticVertexBuffer(
                context.device,
                defaultShader.vertexInput,
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
            const s = 0.5
            const viewProjMatrix = [
                s, 0, 0, 0,
                0, s, 0, 0,
                0, 0, s, 0,
                0, 0, 0, 1,
            ]

            const frame = createEncoderFunction(context, (encoder, renderPassDescriptor) => {
                copyToBuffer(context.device, encoder, viewProjMatrix, viewParamsBuffer)
                const renderPass = encoder.beginRenderPass(renderPassDescriptor)
                renderPass.setBindGroup(0, viewParamBG)
                renderPass.setPipeline(context.renderPipelines.defaultShader)
                renderPass.setVertexBuffer(0, vertexBuffer)
                renderPass.draw(3, 1, 0, 0)
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
