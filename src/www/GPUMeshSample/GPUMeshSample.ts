import { createVertexBufferLayoutNamed } from "../../core/functions.js"
import { GPUContext } from "../../core/GPUContext.js"
import { useArcBallCamera } from "../../hooks/useArcBallCamera.js"
import { loadGPUModel } from "../../loaders/GLTFLoader.js"
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
        create: async function (c: GPUContext, requestFrame) {

            const updateCamera = (view: Matrix4, eye: Vector3) => {
                let projection = Matrix4.perspective(Math.PI * 0.3, c.canvas.width / c.canvas.height, 1, 100)
                // let projection = Matrix4.orthographic(-1000, 1000, -1000, 1000, -10, 10)
                c.camera.values = {
                    // viewProjection: view.multiply(projection),
                    viewProjection: projection.multiply(view),
                    position: new Vector4(...eye.toArray(), 0),
                }
            }

            const disposeArcballCamera = useArcBallCamera(this,
                new Vector3(0, 0, 4),
                Vector3.zero,
                new Vector3(0, 1, 0),
                (view, eye) => {
                    updateCamera(view, eye)
                    requestFrame()
                })

            const pipeline = await c.createRenderPipeline({
                layout: [defaultBindGroup0Layout],
                vertexInput: positionColor,
                shader
            })

            // will have to change the mesh and create a real camera soon.
            const model = await loadGPUModel(c, "./BlenderBoxTextured.glb")
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
                    disposeArcballCamera()
                }
            }
        }
    })
}
