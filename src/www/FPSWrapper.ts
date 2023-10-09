import { CustomElementProperties, createCustomElement, html, useConnected } from "lithos"

declare global {
    interface GlobalEventHandlersEventMap {
        frame: Event;
    }
}

interface Props extends CustomElementProperties {
    details?: string
}
export const FPSWrapper = createCustomElement(function ({ children, details = "", ...props }: Props) {

    let frameCount = 0;
    let lastTime = performance.now();

    const getDisplayText = (frameRate = 60) => `${frameRate.toFixed(2)} FPS ${details}`

    const updateFrameRate = () => {
        const fpsDisplay = this.querySelector("#fps") as HTMLParagraphElement;
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        frameCount++;

        if (deltaTime >= 1000) { // Update frame rate every second
            const frameRate = (frameCount * 1000) / deltaTime;
            fpsDisplay.textContent = getDisplayText(frameRate);
            frameCount = 0;
            lastTime = currentTime;
        }
    }


    return html.Div(
        props,
        html.P({ id: "fps" }, getDisplayText()),
        html.Span(
            {
                on: {
                    frame() {
                        updateFrameRate()
                    }
                }
            },
            ...children
        )
    )

}, { extends: "div" })