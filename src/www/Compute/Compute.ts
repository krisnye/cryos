import { createCustomElement, html, useConnected } from "lithos"
import { createVertexBufferLayoutNamed, sizeof, stringKeys } from "../../core/functions.js"
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
import { typeDescriptors } from "../../data/constants.js"

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

            // goes up to 4000-6000 or so without problem till WebGPU complains buffer is too large.
            const width = 1000
            const size = new Vector3(width, width, 1)
            const volume = Volume.create(size, { input: "u32", output: "u32" });
            const random = randomNumberGenerator()
            for (let i = 0; i < volume.data.input.length; i++) {
                volume.data.input[i] = random() >= 0.5 ? 1 : 0
            }
            const gpuVolume = GPUVolume.createFromCPUVolume(c.device, volume, { read: true });

            const renderPipeline = await c.createRenderPipeline({
                layout: {
                    view_params: [
                        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
                    ]
                },
                vertexInput: positionColorVertexLayout,
                shader: renderShader.replace("{{inject_width}}", width.toString())
            })

            const s = 1
            const vertices =
                [
                    ...new Vector4(0, 0, 0, 1),
                    ...Color.white,
                    ...new Vector4(s, 0, 0, 1),
                    ...Color.white,
                    ...new Vector4(0, s, 0, 1),
                    ...Color.white,
                    ...new Vector4(s, s, 0, 1),
                    ...Color.white,
                    ...new Vector4(0, s, 0, 1),
                    ...Color.white,
                    ...new Vector4(s, 0, 0, 1),
                    ...Color.white,
                ]
            const vertexBuffer = c.createStaticVertexBuffer(
                positionColorVertexLayout,
                vertices
            )

            // Create a buffer to store the view parameters
            const viewParamsBuffer = c.device.createBuffer({
                size: vertices.length * sizeof.f32 + sizeof.f32,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })

            // Create a bind group which places our view params buffer at binding 0
            const viewParamBG = c.device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: viewParamsBuffer } },
                    { binding: 1, resource: { buffer: gpuVolume.buffers.output } }
                ]
            })


            const scale = 1.9
            const viewProjMatrix = Matrix4.translation(- scale / 2, - scale / 2, 0).multiply(Matrix4.scaling(scale / size.x))

            const frame = async () => {
                c.beginCommands()
                {
                    //  compute
                    computePipeline.encodePass(gpuVolume, c.command);

                    //  render
                    c.commandCopyToBuffer([...viewProjMatrix.toArray(), width], viewParamsBuffer)
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(renderPipeline)
                        //  set compute buffer output as input
                        c.render.setBindGroup(0, viewParamBG)
                        c.render.setVertexBuffer(0, vertexBuffer)
                        const instances = size.productOfComponents()
                        c.render.draw(6, instances, 0, 0)
                    }
                    c.endRenderPass()
                }

                await c.endCommands()   //  await till all commands have finished

                // {
                //     const backToCPUVolume = await gpuVolume.copyToCPU()
                //     console.log("AFTER: " + backToCPUVolume.toString({ fractionDigits: 2 }))
                // }

                // now swap input and output
                {
                    const temp = gpuVolume.buffers.input;
                    gpuVolume.buffers.input = gpuVolume.buffers.output;
                    gpuVolume.buffers.output = temp;
                }
                // request new frame every n seconds
                requestAnimationFrame(frame)
                // const seconds = 0.05
                // setTimeout(() => requestAnimationFrame(frame), seconds * 1000)
            }

            requestAnimationFrame(frame)
        })()
    })

    return html.Canvas({
        width: 1024, height: 1024,
        style: { border: "solid 1px black", background: "beige" },
    })
}, { extends: "canvas" })
