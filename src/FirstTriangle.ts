import { createCustomElement, html, useConnected } from "lithos";
import { createGPUContext, createRenderFunction, createStaticVertexBuffer } from "./core/functions.js";
import { defaultShader } from "./core/defaultShader.js";

export const FirstTriangle = createCustomElement(function () {
    useConnected(() => {
        (async () => {

            let context = await createGPUContext(this, { defaultShader })

            const vertexBuffer = createStaticVertexBuffer(
                context.device,
                defaultShader.vertexInput,
                [
                    1, -1, 0, 1,  // 0 position
                    1, 0, 0, 1,   // 0 color
                    -1, -1, 0, 1, // 1 position
                    0, 1, 0, 1,   // 1 color
                    0, 1, 0, 1,   // 2 position
                    0, 0, 1, 1,   // 2 color
                ]
            )

            const frame = createRenderFunction(context, (renderPass) => {
                renderPass.setPipeline(context.renderPipelines.defaultShader);
                renderPass.setVertexBuffer(0, vertexBuffer);
                renderPass.draw(3, 1, 0, 0);
            })

            requestAnimationFrame(frame);
        })();
    })

    return html.Canvas({
        width: 320, height: 240,
        style: { border: "solid 1px black", background: "beige" }
    })
}, { extends: "canvas" })
