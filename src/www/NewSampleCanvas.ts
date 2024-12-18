import { CustomElementProperties, createCustomElement, html, useConnected } from "lithos"
import { Context } from "../types/context-types.js"
import { createContext } from "../create-context.js"

export interface GPUComponent {
    update?(): boolean | void
    render()
    destroy()
}

interface SampleProperties extends CustomElementProperties {
    width?: number
    height?: number
    create(this: HTMLCanvasElement, c: Context, requestFrame: () => void): Promise<GPUComponent>
}

export const NewSampleCanvas = createCustomElement(function (props: SampleProperties) {
    const { width = 320, height = 240, create, ...rest } = props
    useConnected(() => {
        let component: GPUComponent
        (async () => {
            let c = await createContext(this)
            let frame: () => void
            component = await create.call(this, c, () => {
                if (frame) {
                    requestAnimationFrame(frame)
                }
            })
            frame = () => {
                let animated = component.update?.()
                component.render()
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
        style: { border: "solid 1px red", background: "beige" },
        ...rest
    })
}, { extends: "canvas" })
