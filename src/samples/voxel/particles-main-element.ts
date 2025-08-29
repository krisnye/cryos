import { ServiceApplication } from "@adobe/data/lit";
import { customElement, property } from "lit/decorators.js";
import { css, html } from "lit";
import { createMainService, MainService } from "./services/main-service.js";
import { getWebGPUGraphicsContext } from "graphics/get-web-gpu-device-and-context.js";
import { when } from "lit/directives/when.js";
import "./elements/particles-label.js";
import "./elements/canvas-overlay.js";

@customElement("voxel-main-element")
export class ParticlesMainElement extends ServiceApplication<MainService> {

    @property({ type: Number })
    width = 1600;
    @property({ type: Number })
    height = 1200;

    static override styles = [
        css`
            canvas, voxel-canvas-overlay {
                position: absolute;
                top: 0;
                left: 0;
            }
            voxel-canvas-overlay {
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
            <div @pointermove=${(e: PointerEvent) => this.service.database.transactions.setMousePosition([e.clientX, e.clientY])}
                 @click=${() => this.service.database.transactions.click()}
                 tabindex="0"
                 style="outline: none;">
                <canvas width=${this.width} height=${this.height}></canvas>
                ${when(this.service, () => html`<voxel-canvas-overlay style="width: ${this.width}px; height: ${this.height}px;"></voxel-canvas-overlay>`)}
            </div>
        `;
    }
}
