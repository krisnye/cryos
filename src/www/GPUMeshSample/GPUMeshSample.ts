import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { loadGPUMeshes } from "../../loaders/GLTFLoader.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Vector4 } from "../../math/Vector4.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./GPUMeshSample.wgsl"

const positionColor = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export function GPUMeshSample() {
    return SampleCanvas({
        create: async (c: GPUContext) => {
            const camera = c.createCameraUniformHelper({ viewProjection: Matrix4.translation(0, -0.5, 0).multiply(Matrix4.scaling(20)), position: Vector4.zero })
            const pipeline = await c.createRenderPipeline({
                layout: [[camera.layout]],
                vertexInput: positionColor,
                shader
            })
            const bindGroup = c.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [camera.entry]
            })

            // will have to change the mesh and create a real camera soon.
            const meshes = await loadGPUMeshes(c, "./avocado.glb")
            for (let mesh of Object.values(meshes)) {
                mesh.buildRenderPipeline(c.device,
                    pipeline.descriptor.vertex.module,
                    c.canvasContext.getCurrentTexture().format,
                    c.depthTexture.format,
                    pipeline.getBindGroupLayout(0)
                )
            }

            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    camera.commandCopyToBuffer()
                    c.beginRenderPass()
                    for (let mesh of Object.values(meshes)) {
                        mesh.render(c.render, bindGroup)
                    }
                    c.endRenderPass()
                    c.endCommands()
                },
                destroy() {
                }
            }
        }
    })
}
