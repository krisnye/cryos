import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../core/functions.js"
import { GPUContext } from "../core/GPUContext.js"
import { Vector4 } from "../math/Vector4.js"
import { Color } from "../math/Color.js"
import { Matrix4 } from "../math/Matrix4.js"
import shader from "./02_BindGroups.wgsl"

const positionColorVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export const BindGroups = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let c = await GPUContext.create(this)

            const pipeline = await c.createRenderPipeline({
                layout: {
                    view_params: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }]
                },
                vertexInput: positionColorVertexLayout,
                shader
            })

            const vertexBuffer = c.createStaticVertexBuffer(
                positionColorVertexLayout,
                [
                    ...new Vector4(1, -1, 0, 1),
                    ...Color.red,
                    ...new Vector4(-1, -1, 0, 1),
                    ...Color.green,
                    ...new Vector4(0, 1, 0, 1),
                    ...Color.blue
                ]

            )

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

            const viewProjMatrix = Matrix4.scaling(0.5)

            const frame = () => {
                c.beginCommands()
                {
                    c.commandCopyToBuffer(viewProjMatrix.toArray(), viewParamsBuffer)
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(pipeline)
                        c.render.setBindGroup(0, viewParamBG)
                        c.render.setVertexBuffer(0, vertexBuffer)
                        c.render.draw(3, 1, 0, 0)
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
