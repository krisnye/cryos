import { createCustomElement, html, useConnected } from "lithos";
import { createVertexBufferLayoutNamed } from "../core/functions.js";
import { GPUContext } from "../core/GPUContext.js";
import shader from "./01_FirstTriangle.wgsl";

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
                    1, -1, 0, 1,  // 0 position
                    1, 0, 0, 1,   // 0 color
                    -1, -1, 0, 1, // 1 position
                    0, 1, 0, 1,   // 1 color
                    0, 1, 0, 1,   // 2 position
                    0, 0, 1, 1,   // 2 color
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
