import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../core/functions.js"
import { GPUContext } from "../core/GPUContext.js"
import { Vector4 } from "../math/Vector4.js"
import { Color } from "../math/Color.js"
import shader from "./01_FirstTriangle.wgsl"

export const FirstTriangle = createCustomElement(function () {
    const positionColorVertexLayout = createVertexBufferLayoutNamed({
        position: "float32x4",
        color: "float32x4"
    })

    useConnected(() => {
        (async () => {

            let c = await GPUContext.create(this)

            const pipeline = await c.createRenderPipeline(
                { vertexInput: positionColorVertexLayout, shader }
            )

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

            const frame = () => {
                c.beginCommands()
                {
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(pipeline)
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
