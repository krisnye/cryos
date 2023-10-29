import { GPUContext } from "../../core/GPUContext.js"
import { useArcBallCamera } from "../../hooks/useArcBallCamera.js"
import { loadGLTFModel } from "../../loaders/GLTFLoader.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Vector3 } from "../../math/Vector3.js"
import { SampleCanvas } from "../SampleCanvas.js"
import shader from "./GPUMeshSample.wgsl"

export function GPUMeshSample() {
    return SampleCanvas({
        width: 640,
        height: 480,
        create: async function (c: GPUContext, requestFrame) {

            const disposeArcballCamera = useArcBallCamera(this,
                new Vector3(0, 0, 4),
                Vector3.zero,
                new Vector3(0, 1, 0),
                (view, eye) => {
                    let projection = Matrix4.perspective(Math.PI * 0.3, c.canvas.width / c.canvas.height, 1, 100)
                    c.camera.patch({
                        viewProjectionMatrix: projection.multiply(view),
                        cameraPosition: eye.toVector4(1),
                    })
                    requestFrame()
                }
            )

            const model = await loadGLTFModel(c, { url: "./BlenderBoxTextured.glb", shader })

            return {
                render(c: GPUContext) {
                    c.beginCommands()
                    c.camera.commandCopyToGPU()
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
