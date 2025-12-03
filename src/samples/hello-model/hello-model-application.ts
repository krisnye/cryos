import { customElement } from "lit/decorators.js";
import { html, css, CSSResult, TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { createHelloModelService, HelloModelService } from "./hello-model-service.js";
import "../../graphics/elements/graphics-viewport.js";
import { pickFromViewport } from "../../graphics/picking/pick-from-viewport.js";
import { GraphicsViewport } from "../../graphics/elements/graphics-viewport.js";

// UI Component
export const tagName = "hello-model-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: HelloModelApplication;
    }
}

@customElement(tagName)
export class HelloModelApplication extends ApplicationElement<HelloModelService> {
    constructor() {
        super();
        this.service = createHelloModelService();
    }

    static override styles: CSSResult = css`
        .game-container {
            background-color: beige;
        }
    `;

    override render(): TemplateResult {
        return html`
            <div class="game-container">
                <div>
                    Hello Model!
                </div>
                <graphics-viewport style="border: 1px solid blue;" .initialCamera=${{ position: [0,0,10], target: [0, 0, 0] }} .clearColor=${[0.0, 0.0, 0.0, 0.0] as const}
                @pointermove=${(e: PointerEvent) => {
                    const viewport = (e.target as GraphicsViewport);
                    const bounds = viewport.getBoundingClientRect();
                    const x = e.clientX - bounds.left;
                    const y = e.clientY - bounds.top;
                    const entity = pickFromViewport({ store: this.service.store, viewportPosition: [x, y], viewportId: viewport.viewportId! });
                }}>
                </graphics-viewport>
                <graphics-viewport style="border: 1px solid red;" .initialCamera=${{ position: [5, 3, -5], target: [0, 0, 0] }} .clearColor=${[0.0, 0.0, 0.0, 0.0] as const}
                @pointermove=${(e: PointerEvent) => {
                    const viewport = (e.target as GraphicsViewport);
                    const bounds = viewport.getBoundingClientRect();
                    const x = e.clientX - bounds.left;
                    const y = e.clientY - bounds.top;
                    const entity = pickFromViewport({ store: this.service.store, viewportPosition: [x, y], viewportId: viewport.viewportId! });
                    if (entity) {
                        console.log(entity);
                    }
                }}>
                >
                </graphics-viewport>
            </div>
        `;
    }
}
