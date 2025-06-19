import { getWebGPUGraphicsContext, GraphicsContext } from "graphics";
import { html, css, LitElement, PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import { withHooks } from "@adobe/data/lit";

@customElement("graphics-tutorials")
export class GraphicsTutorials extends LitElement {

    static override styles = css`
        canvas {
            width: 640px;
            height: 480px;
            border: solid 1px red;
        }
    `;

    graphics!: GraphicsContext;

    override async firstUpdated(changedProperties: PropertyValues) {
        super.firstUpdated(changedProperties);
        const canvas = this.shadowRoot!.querySelector("canvas")!;
        this.graphics = await getWebGPUGraphicsContext(canvas);
    }

    @withHooks
    override render() {
        return html`
            <div>
                <h1>Graphics Tutorials</h1>
                <canvas></canvas>
            </div>
        `;
    }

}
