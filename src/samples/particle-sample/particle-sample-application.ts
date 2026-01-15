import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createParticleSampleService, ParticleSampleService } from "./particle-sample-service.js";

// UI Component
export const tagName = "particle-sample-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: ParticleSampleApplication;
    }
}

@customElement(tagName)
export class ParticleSampleApplication extends LitElement {
    private service: ParticleSampleService;

    constructor() {
        super();
        this.service = createParticleSampleService();
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
                <div>Particle Sample</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}

