import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createMaterialVolumeModelSampleService, MaterialVolumeModelSampleService } from "./material-volume-model-sample-service.js";

export const tagName = "material-volume-model-sample";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: MaterialVolumeModelSampleApplication;
    }
}

@customElement(tagName)
export class MaterialVolumeModelSampleApplication extends LitElement {
    private service: MaterialVolumeModelSampleService;

    constructor() {
        super();
        this.service = createMaterialVolumeModelSampleService();
    }

    static override styles: CSSResult = css`
        .game-container {
            background-color: beige;
            padding: 1rem;
        }
        
        canvas {
            border: 1px solid blue;
            display: block;
        }
    `;

    override firstUpdated(): void {
        this.service.transactions.setCanvas(this.renderRoot.querySelector("canvas") ?? null);
    }

    override render(): TemplateResult {
        return html`
            <div class="game-container">
                <div>Material Volume Model Sample - House Chunk (16x16x16, 25cm per voxel)</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}
