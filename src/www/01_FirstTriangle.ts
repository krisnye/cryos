import { createCustomElement, html, useConnected } from "lithos";
import { createGPUContext, createRenderFunction as createEncoderFunction, createStaticVertexBuffer, toWGSLStructBody } from "../core/functions.js";
import { GPURenderPipelineProperties } from "../core/types.js";
import { positionColor } from "../core/vertexFormats.js";

const defaultShader: GPURenderPipelineProperties = {
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

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    out.position = vert.position;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}`
};

export const FirstTriangle = createCustomElement(function () {
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

            const frame = createEncoderFunction(context, (encoder, renderPassDescriptor) => {
                const renderPass = encoder.beginRenderPass(renderPassDescriptor)
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
