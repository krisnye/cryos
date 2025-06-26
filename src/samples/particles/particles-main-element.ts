import { ServiceApplication } from "@adobe/data/lit";
import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { createMainService, MainService } from "./services/create-main-service.js";
import { getWebGPUGraphicsContext } from "graphics/get-web-gpu-device-and-context.js";
import "./elements/particles-label.js";
import { when } from "lit/directives/when.js";

@customElement("particles-main-element")
export class ParticlesMainElement extends ServiceApplication<MainService> {

    static override styles = [
        css`
            canvas {
                border: 1px solid black;
                width: 800px;
                height: 600px;
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
                <h1>Particle Sample</h1>
                <canvas></canvas>
                ${when(this.service, () => html`<particles-label></particles-label>`)}
            </div>
        `;
    }

}
