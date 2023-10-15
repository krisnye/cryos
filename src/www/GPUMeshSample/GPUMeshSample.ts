import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { loadGPUMeshes } from "../../loaders/GLTFLoader.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Vector3 } from "../../math/Vector3.js"
import { Vector4 } from "../../math/Vector4.js"
import { defaultBindGroup0Layout } from "../../render/GPUNode.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./GPUMeshSample.wgsl"

const positionColor = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})

export function GPUMeshSample() {
    return SampleCanvas({
        width: 640,
        height: 480,
        create: async (c: GPUContext) => {
            const position = new Vector3(100, 500, 500)
            c.camera.values = {
                viewProjection:
                    Matrix4.perspective(Math.PI / 3, c.canvas.width / c.canvas.height, -10, 10)
                        .multiply(
                            Matrix4.lookAt(
                                position,
                                Vector3.zero,
                                new Vector3(0, 1, 0),
                            )
                        ),
                position: new Vector4(...position.toArray(), 0),
            }
            const pipeline = await c.createRenderPipeline({
                layout: [defaultBindGroup0Layout],
                vertexInput: positionColor,
                shader
            })

            // will have to change the mesh and create a real camera soon.
            const model = await loadGPUMeshes(c, "./2CylinderEngine.glb")
            model.buildRenderPipeline(c, pipeline)

            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    c.camera.commandCopyToBuffer()
                    model.prerender(c)  //  this allows nodes to update their model transform buffers
                    c.beginRenderPass()
                    model.render(c)
                    c.endRenderPass()
                    c.endCommands()
                },
                destroy() {
                    model.destroy()
                }
            }
        }
    })
}
