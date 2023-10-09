import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { Color } from "../../math/Color.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { VolumePipeline } from "../../compute/GPUVolumePipeline.js"
import { Volume } from "../../data/Volume.js"
import { GPUVolume } from "../../compute/GPUVolume.js"
import { Vector3 } from "../../math/Vector3.js"
import computeShader from "./computeShader.wgsl"
import renderShader from "./renderShader.wgsl"
import { randomNumberGenerator } from "../../math/RandomNumberGenerator.js"

const positionColorVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export type LifeVolumeType = Volume<{
    input: "f32";
    output: "f32";
}>;

export const Compute = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let c = await GPUContext.create(this)

            const computePipeline = await VolumePipeline.create(c.device, {
                bindings: {
                    input: "u32",
                    output: "u32"
                },
                shader: computeShader
            })

            const size = new Vector3(6, 6, 1);
            const volume = Volume.create(size, { input: "u32", output: "u32" });
            const random = randomNumberGenerator()
            for (let i = 0; i < volume.data.input.length; i++) {
                volume.data.input[i] = random() >= 0.5 ? 1 : 0
            }
            const gpuVolume = GPUVolume.createFromCPUVolume(c.device, volume, { read: true });

            const renderPipeline = await c.createRenderPipeline({
                layout: {
                    view_params: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }]
                },
                vertexInput: positionColorVertexLayout,
                shader: renderShader
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
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: viewParamsBuffer } }]
            })

            const viewProjMatrix = Matrix4.scaling(0.5)

            const frame = async () => {
                c.beginCommands()
                {
                    //  compute
                    computePipeline.encodePass(gpuVolume, c.command);

                    //  render
                    c.commandCopyToBuffer(viewProjMatrix.toArray(), viewParamsBuffer)
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(renderPipeline)
                        c.render.setBindGroup(0, viewParamBG)
                        c.render.setVertexBuffer(0, vertexBuffer)
                        c.render.draw(3, 1, 0, 0)
                    }
                    c.endRenderPass()
                }

                await c.endCommands()   //  await till all commands have finished

                const backToCPUVolume = await gpuVolume.copyToCPU()
                console.log("AFTER: " + backToCPUVolume.toString({ fractionDigits: 2 }))
            }

            requestAnimationFrame(frame)
        })()
    })

    return html.Canvas({
        width: 320, height: 240,
        style: { border: "solid 1px black", background: "beige" }
    })
}, { extends: "canvas" })
