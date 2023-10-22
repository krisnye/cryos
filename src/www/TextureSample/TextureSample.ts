import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./TextureSample.wgsl"
import textureUrl from "./f.png";
import { Vector2 } from "../../math/Vector2.js"

const positionTextureVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    texcoord: "float32x2",
})

export function TextureSample() {
    return SampleCanvas({
        create: async (c: GPUContext) => {
            const textureHelper = await c.loadTextureFromUrl(textureUrl)
            const sampler = c.device.createSampler();

            const s = 0.9
            const vertices = [
                ...new Vector4(s, -s, 0, 1), ...new Vector2(1, -1),
                ...new Vector4(-s, -s, 0, 1), ...new Vector2(-1, -1),
                ...new Vector4(-s, s, 0, 1), ...new Vector2(-1, 1),
                ...new Vector4(-s, s, 0, 1), ...new Vector2(-1, 1),
                ...new Vector4(s, s, 0, 1), ...new Vector2(1, 1),
                ...new Vector4(s, -s, 0, 1), ...new Vector2(1, -1),
            ]
            const vertexBuffer = c.createStaticVertexBuffer(positionTextureVertexLayout, vertices)
            const pipeline = await c.createRenderPipeline({
                vertexInput: positionTextureVertexLayout, shader, layout: [
                    [
                        { binding: 0, sampler: { "type": "filtering" }, visibility: GPUShaderStage.FRAGMENT },
                        { binding: 1, texture: { sampleType: "float", viewDimension: "2d" }, visibility: GPUShaderStage.FRAGMENT },
                    ]
                ]
            })
            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: textureHelper.texture.createView() },
                ],
            });

            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    textureHelper.commandCopyToTexture()
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
                }
            }
        }
    })
}
