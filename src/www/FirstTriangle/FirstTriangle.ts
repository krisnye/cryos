import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { Color } from "../../math/Color.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./FirstTriangle.wgsl"

const positionColorVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export function FirstTriangle() {
    return SampleCanvas({
        create: async (c: GPUContext) => {
            const vertexBuffer = c.createStaticVertexBuffer(
                positionColorVertexLayout,
                [
                    ...new Vector4(1, -1, 0, 1), ...Color.red,
                    ...new Vector4(-1, -1, 0, 1), ...Color.green,
                    ...new Vector4(0, 1, 0, 1), ...Color.blue
                ]
            )
            const pipeline = await c.createRenderPipeline({ vertexInput: positionColorVertexLayout, shader })
            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    c.beginRenderPass()
                    c.render.setPipeline(pipeline)
                    c.render.setVertexBuffer(0, vertexBuffer)
                    c.render.draw(3, 1, 0, 0)
                    c.endRenderPass()
                    c.endCommands()
                },
                destroy() {
                    vertexBuffer.destroy()
                }
            }
        }
    })
}
