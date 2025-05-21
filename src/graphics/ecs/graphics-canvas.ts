import { getWebGPUGraphicsContext } from "../get-web-gpu-device-and-context";
import { GraphicsDatabase } from "./graphics-database";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { graphicsExtensions } from "./graphics-extensions";
import { createDatabase } from "ecs/database";

@customElement("graphics-canvas")
export class GraphicsCanvas extends LitElement {

    static override styles = css`
        :host, canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
    `;

    @property({ attribute: false })
    init?: (db: GraphicsDatabase & any) => void;

    @property({ attribute: false })
    database!: GraphicsDatabase;

    override render() {
        return html`
            <canvas></canvas>
        `;
    }

    override async firstUpdated() {
        const canvas = this.renderRoot.querySelector("canvas")!;
        const context = await getWebGPUGraphicsContext(canvas)!;
        const database: any = createDatabase().withExtension(graphicsExtensions(context));
        this.init?.(database);
        this.database = database;
    }

}
