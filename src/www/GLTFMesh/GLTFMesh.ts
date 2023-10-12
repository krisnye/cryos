import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { uploadGLB } from "../../render/glb.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Matrix4 } from "../../math/Matrix4.js"
import shader from "./GLTFMesh.wgsl"

const positionColor = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export const GLTFMesh = createCustomElement(function () {
    useConnected(() => {
        (async () => {
            const c = await GPUContext.create(this)

            const uniforms = c.createUniformHelper(
                { binding: 0, visibility: GPUShaderStage.VERTEX },
                { view_proj: ["mat4x4", "f32"] }
            )

            const pipeline = await c.createRenderPipeline({
                layout: [[uniforms.layout]],
                vertexInput: positionColor,
                shader
            })

            // Create a bind group which places our view params buffer at binding 0
            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [uniforms.entry]
            })

            const viewProjMatrix = Matrix4.translation(0, -0.5, 0).multiply(Matrix4.scaling(20))

            // load glb
            const buffer = await (await fetch("./avocado.glb")).arrayBuffer()
            const glbMesh = uploadGLB(buffer, c.device)

            glbMesh.buildRenderPipeline(c.device,
                pipeline.descriptor.vertex.module,
                c.canvasContext.getCurrentTexture().format,
                c.depthTexture.format,
                pipeline.getBindGroupLayout(0)
            )

            const frame = () => {
                c.beginCommands()
                {
                    uniforms.commandCopyToBuffer({ view_proj: viewProjMatrix })
                    c.beginRenderPass()
                    {
                        glbMesh.render(c.render, bindGroup)
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
