import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createGridWorldSampleService, GridWorldSampleService } from "./grid-world-sample-service.js";

// UI Component
export const tagName = "grid-world-sample";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: GridWorldSampleApplication;
    }
}

@customElement(tagName)
export class GridWorldSampleApplication extends LitElement {
    private service: GridWorldSampleService;

    constructor() {
        super();
        this.service = createGridWorldSampleService();
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
                <div>Grid World Sample - 3x3 grid of chunks around origin with axis</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}

