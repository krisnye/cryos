import { CustomElementProperties, createCustomElement, html, useConnected } from "lithos"
import { beginRenderPass } from "../functions/begin-render-pass.js"
import { createCanvasContext } from "../functions/create-canvas-context.js"
import { CanvasContext } from "../types/canvas-context.js"

export interface Component {
    update?(encoder: GPUCommandEncoder): Promise<boolean | void>
    render(renderPass: GPURenderPassEncoder)
    destroy()
}

interface SampleProperties extends CustomElementProperties {
    width?: number
    height?: number
    create(this: HTMLCanvasElement, c: CanvasContext, requestFrame: () => void): Promise<Component>
}

export const NewSampleCanvas = createCustomElement(function (props: SampleProperties) {
    const { width = 320, height = 240, create, ...rest } = props
    useConnected(() => {
        let component: Component
        (async () => {
            let c = await createCanvasContext(this)
            let frame: () => void
            component = await create.call(this, c, () => {
                if (frame) {
                    requestAnimationFrame(frame)
                }
            })
            frame = async() => {

                const encoder = c.device.createCommandEncoder();
                let animated = await component.update?.(encoder);

                const renderPass = beginRenderPass(c, encoder);
        
                component.render(renderPass);

                renderPass.end();
                c.device.queue.submit([encoder.finish()]);
                await c.device.queue.onSubmittedWorkDone();

                if (animated) {
                    requestAnimationFrame(frame)
                } 
                this.dispatchEvent(new CustomEvent("frame", { bubbles: true }))
            }
            frame()
        })()

        return () => {
            console.log("DESTROY", component)
            component?.destroy()
        }
    })

    return html.Canvas({
        width, height,
        style: { border: "solid 4px red", background: "beige" },
        ...rest
    })
}, { extends: "canvas" })
