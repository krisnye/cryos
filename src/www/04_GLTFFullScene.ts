import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../core/functions.js"
import { GPURenderPipelineProperties } from "../core/types.js"
import { uploadGLB } from "../render/glb.js"
import { GPUContext } from "../core/GPUContext.js"
import shader from "./04_GLTFFullScene.wgsl"

const positionColor = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export const GLTFFullScene = createCustomElement(function (this: HTMLCanvasElement) {
    useConnected(() => {
        (async () => {
            let c = await GPUContext.create(this)

            const pipeline = await c.createRenderPipeline({
                layout: {
                    view_params: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }]
                },
                vertexInput: positionColor,
                shader
            })

            // Create a buffer to store the view parameters
            const viewParamsBuffer = c.device.createBuffer({
                size: 16 * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })

            // Create a bind group which places our view params buffer at binding 0
            const viewParamBG = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: viewParamsBuffer } }]
            })

            // TODO: Use a camera to create this view.
            const s = 1
            const viewProjMatrix = [
                s, 0, 0, 0,
                0, s, 0, 0,
                0, 0, s, 0,
                0, 0, 0, 1,
            ]

            // load glb
            const buffer = await (await fetch("./2CylinderEngine.glb")).arrayBuffer()
            let glbMesh = uploadGLB(buffer, c.device)

            glbMesh.buildRenderPipeline(c.device,
                pipeline.descriptor.vertex.module,
                c.canvasContext.getCurrentTexture().format,
                c.depthTexture.format,
                pipeline.getBindGroupLayout(0)
            )

            const frame = () => {
                c.beginCommands()
                {
                    c.commandCopyToBuffer(viewProjMatrix, viewParamsBuffer)
                    c.beginRenderPass()
                    {
                        glbMesh.render(c.render, viewParamBG);
                    }
                    c.endRenderPass()
                }
                c.endCommands()
            }

            requestAnimationFrame(frame)
        })()
    })

    return html.Canvas({
        width: 320, height: 240,
        style: { border: "solid 1px black", background: "beige" }
    })
}, { extends: "canvas" })
