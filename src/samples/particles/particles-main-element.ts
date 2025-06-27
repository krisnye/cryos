import { ServiceApplication } from "@adobe/data/lit";
import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { createMainService, MainService } from "./services/create-main-service.js";
import { getWebGPUGraphicsContext } from "graphics/get-web-gpu-device-and-context.js";
import { when } from "lit/directives/when.js";
import "./elements/particles-label.js";
import "./elements/canvas-overlay.js";

@customElement("particles-main-element")
export class ParticlesMainElement extends ServiceApplication<MainService> {

    static override styles = [
        css`
            canvas, canvas-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 800px;
                height: 600px;
            }
            canvas-overlay {
                border: 1px solid red;
            }

        `
    ];

    protected override async createService(): Promise<MainService> {
        const context = await getWebGPUGraphicsContext(this.renderRoot.querySelector("canvas")!);
        return createMainService(context);
    }

    override render() {
        // we have to render the canvas first because we use it to create the service.
        // we don't render any other children until the service is created.
        return html`
            <div>
                <canvas width="800" height="600"></canvas>
                ${when(this.service, () => html`<canvas-overlay></canvas-overlay>`)}
            </div>
        `;
    }

}
