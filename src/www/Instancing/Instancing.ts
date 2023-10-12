import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { Color } from "../../math/Color.js"
import { Matrix4 } from "../../math/Matrix4.js"
import shader from "./Instancing.wgsl"

const positionColorVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export const Instancing = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let c = await GPUContext.create(this)

            const uniforms = c.createUniformHelper(
                { binding: 0, visibility: GPUShaderStage.VERTEX },
                {
                    view_proj: ["mat4x4", "f32"]
                }
            )

            const pipeline = await c.createRenderPipeline({
                layout: [[uniforms.layout]],
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

            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [uniforms.entry]
            })

            const frame = () => {
                c.beginCommands()
                {
                    uniforms.commandCopyToBuffer({ view_proj: Matrix4.scaling(0.5) })
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(pipeline)
                        c.render.setBindGroup(0, bindGroup)
                        c.render.setVertexBuffer(0, vertexBuffer)
                        c.render.draw(3, 10, 0, 0)
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
