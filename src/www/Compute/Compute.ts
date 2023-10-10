import { CustomElementProperties, createCustomElement, html, useConnected, useState } from "lithos"
import { createVertexBufferLayoutNamed, sizeof } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { Vector4 } from "../../math/Vector4.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { VolumePipeline } from "../../compute/GPUVolumePipeline.js"
import { Volume } from "../../data/Volume.js"
import { GPUVolume } from "../../compute/GPUVolume.js"
import { Vector3 } from "../../math/Vector3.js"
import { randomNumberGenerator } from "../../math/RandomNumberGenerator.js"
import { FPSWrapper } from "../FPSWrapper.js"
import computeShader from "./computeShader.wgsl"
import renderShader from "./renderShader.wgsl"

const positionVertexLayout = createVertexBufferLayoutNamed({
    position: "float32x4",
})

export type LifeVolumeType = Volume<{
    input: "f32";
    output: "f32";
}>;

interface ComputeProps extends CustomElementProperties {
    width?: number,
    height?: number,
    gridWidth: number,
    children: never[]
}

export const ComputeCanvas = createCustomElement(function (this: HTMLCanvasElement, { width, height, gridWidth }: ComputeProps) {

    useConnected(() => {
        let c: GPUContext;
        (async () => {
            c = await GPUContext.create(this)

            const computePipeline = await VolumePipeline.create(c.device, {
                bindings: {
                    input: "u32",
                    output: "u32"
                },
                shader: computeShader
            })

            // goes up to 4000-6000 or so without problem till WebGPU complains buffer is too large.

            const size = new Vector3(gridWidth, gridWidth, 1)
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
                vertexInput: positionVertexLayout,
                shader: renderShader.replace("{{inject_width}}", gridWidth.toString())
            })

            const vertices =
                [
                    ...new Vector4(0, 0, 0, 1),
                    ...new Vector4(1, 0, 0, 1),
                    ...new Vector4(0, 1, 0, 1),
                    ...new Vector4(1, 1, 0, 1),
                    ...new Vector4(0, 1, 0, 1),
                    ...new Vector4(1, 0, 0, 1),
                ]
            const vertexBuffer = c.createStaticVertexBuffer(positionVertexLayout, vertices)

            // Create a buffer to store the view parameters
            const viewParamsBuffer = c.device.createBuffer({
                size: vertices.length * sizeof.f32,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })

            // Create a bind group which places our view params buffer at binding 0
            const viewParamBGs = [gpuVolume.buffers.input, gpuVolume.buffers.output].map(buffer => c.device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: viewParamsBuffer } },
                    { binding: 1, resource: { buffer } }
                ]
            }))

            const scale = 1.9
            const viewProjMatrix = Matrix4.translation(- scale / 2, - scale / 2, 0).multiply(Matrix4.scaling(scale / size.x))

            let count = 0
            const frame = async () => {
                c.beginCommands()
                {
                    //  compute
                    computePipeline.encodePass(gpuVolume, c.command);

                    //  render
                    c.commandCopyToBuffer([...viewProjMatrix.toArray(), gridWidth], viewParamsBuffer)
                    c.beginRenderPass()
                    {
                        c.render.setPipeline(renderPipeline)
                        //  set compute buffer output as input, but alternate which one to show each frame
                        c.render.setBindGroup(0, viewParamBGs[count++ % 2])
                        c.render.setVertexBuffer(0, vertexBuffer)
                        const instances = size.productOfComponents()
                        c.render.draw(6, instances, 0, 0)
                    }
                    c.endRenderPass()
                }

                await c.endCommands()   //  await till all commands have finished

                {
                    // const cpuVolume = await gpuVolume.copyToCPU()
                }

                // now swap input and output
                {
                    const temp = gpuVolume.buffers.input;
                    gpuVolume.buffers.input = gpuVolume.buffers.output;
                    gpuVolume.buffers.output = temp;
                }
                // request new frame every n seconds
                let seconds = 0
                if (seconds === 0) {
                    requestAnimationFrame(frame)
                }
                else {
                    setTimeout(() => requestAnimationFrame(frame), seconds * 1000)
                }
                //  dispatch frame event
                this.dispatchEvent(new CustomEvent("frame", { bubbles: true }))
            }

            requestAnimationFrame(frame)
        })()
        return () => {
            c?.destroy()
        }
    }, [gridWidth])

    return html.Canvas({
        width: 1024, height: 1024,
        style: { border: "solid 1px black", background: "beige" },
    })
}, { extends: "canvas" })

export const Compute = createCustomElement(function () {
    const minSize = 64
    const maxSize = 4096
    const [width, setWidth] = useState(256)

    return html.Div(
        {

            on: {
                click() {
                    let newSize = width * 2
                    if (newSize > maxSize) {
                        newSize = minSize
                    }
                    setWidth(newSize)
                }
            }
        },

        FPSWrapper({ details: ` @ ${width} * ${width}` }, ComputeCanvas({ width: 1024, height: 1024, gridWidth: width }))
    )

}, { extends: "div" })
