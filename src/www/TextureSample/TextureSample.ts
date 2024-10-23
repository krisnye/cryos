import { createVertexBufferLayoutNamed } from "../../internal/core/functions.js"
import { GPUContext } from "../../internal/core/GPUContext.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./TextureSample.wgsl"
import textureUrl from "./f.png";
import { GPUTextureHelper } from "../../internal/core/GPUTextureHelper.js";

const positionTextureVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    texcoord: "float32x2",
})

export function TextureSample() {
    return SampleCanvas({
        create: async (c: GPUContext) => {
            const texture = await c.loadTextureFromUrl(textureUrl)

            const s = 0.9
            const vertices = [
                //  x, y, z, u, v
                s, -s, 0, 1, 1, -1,
                -s, -s, 0, 1, -1, -1,
                -s, s, 0, 1, -1, 1,
                -s, s, 0, 1, -1, 1,
                s, s, 0, 1, 1, 1,
                s, -s, 0, 1, 1, -1,
            ]
            const vertexBuffer = c.createStaticVertexBuffer(positionTextureVertexLayout, vertices)
            const pipeline = await c.createRenderPipeline({
                vertexInput: positionTextureVertexLayout,
                shader,
                layout: [
                    [...GPUTextureHelper.getBindGroupLayoutEntries(0)]
                ]
            })
            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    ...texture.getBindGroupEntries(0)
                ],
            });

            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    texture.commandCopyToGPU()
                    c.beginRenderPass()
                    c.render.setPipeline(pipeline)
                    c.render.setBindGroup(0, bindGroup)
                    c.render.setVertexBuffer(0, vertexBuffer)
                    c.render.draw(6, 1, 0, 0)
                    c.endRenderPass()
                    c.endCommands()
                },
                destroy() {
                    vertexBuffer.destroy()
                    texture.destroy();
                }
            }
        }
    })
}
