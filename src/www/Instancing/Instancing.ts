import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { Color } from "../../math/Color.js"
import { Matrix4 } from "../../math/Matrix4.js"
import shader from "./Instancing.wgsl"
import { SampleCanvas } from "../SampleCanvas.js"
import { Vector3 } from "../../math/Vector3.js"

const positionColorVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export function Instancing() {
    return SampleCanvas({
        create: async (c: GPUContext) => {
            c.camera.values = { viewProjection: Matrix4.scaling(0.5), position: Vector3.zero }
            const pipeline = await c.createRenderPipeline({
                layout: [[c.camera.layout]],
                vertexInput: positionColorVertexLayout, shader
            })
            const vertexBuffer = c.createStaticVertexBuffer(
                positionColorVertexLayout,
                [
                    ...new Vector4(1, -1, 0, 1), ...Color.red,
                    ...new Vector4(-1, -1, 0, 1), ...Color.green,
                    ...new Vector4(0, 1, 0, 1), ...Color.blue
                ]
            )
            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [c.camera.entry]
            })
            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    c.camera.commandCopyToGPU()
                    c.beginRenderPass()
                    c.render.setPipeline(pipeline)
                    c.render.setBindGroup(0, bindGroup)
                    c.render.setVertexBuffer(0, vertexBuffer)
                    c.render.draw(3, 10, 0, 0)
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