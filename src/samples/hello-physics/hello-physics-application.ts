import { html, css, CSSResult, TemplateResult, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createHelloPhysicsService, HelloPhysicsService } from "./hello-physics-service.js";

// UI Component
export const tagName = "hello-physics-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: HelloPhysicsApplication;
    }
}

@customElement(tagName)
export class HelloPhysicsApplication extends LitElement {
    private service: HelloPhysicsService;

    constructor() {
        super();
        this.service = createHelloPhysicsService();
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
                <div>Hello Physics!</div>
                <canvas width="800" height="600"></canvas>
            </div>
        `;
    }
}

