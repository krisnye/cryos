import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createHelloModelService, HelloModelService } from "./hello-model-service.js";

// UI Component
export const tagName = "hello-model-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: HelloModelApplication;
    }
}

@customElement(tagName)
export class HelloModelApplication extends LitElement {
    private service: HelloModelService;

    constructor() {
        super();
        this.service = createHelloModelService();
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
        this.service.store.resources.canvas = this.renderRoot.querySelector("canvas") ?? null;
    }

    override render(): TemplateResult {
        return html`
            <div class="game-container">
                <div>Hello Model!</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}

