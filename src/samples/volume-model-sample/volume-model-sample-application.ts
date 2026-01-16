import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createVolumeModelSampleService, VolumeModelSampleService } from "./volume-model-sample-service.js";

// UI Component
export const tagName = "volume-model-sample-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VolumeModelSampleApplication;
    }
}

@customElement(tagName)
export class VolumeModelSampleApplication extends LitElement {
    private service: VolumeModelSampleService;

    constructor() {
        super();
        this.service = createVolumeModelSampleService();
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
                <div>Volume Model Sample - House Chunk (16x16x16, 25cm per voxel)</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}

