import { customElement } from "lit/decorators.js";
import { html, css, CSSResult, TemplateResult } from "lit";
import { HelloModelBaseElement } from "./hello-model-base-element.js";
import { createHelloModelMainService } from "./services/main-service/hello-model-main-service.js";
import "../../graphics/elements/graphics-viewport.js";
import { pickFromViewport } from "../../graphics/picking/pick-from-viewport.js";
import { GraphicsViewport } from "../../graphics/elements/graphics-viewport.js";

export const tagName = "hello-model-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: HelloModelGame;
    }
}

@customElement(tagName)
export class HelloModelGame extends HelloModelBaseElement {
    constructor() {
        super();
        this.service = createHelloModelMainService();
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
                    const entity = pickFromViewport({ store: this.service.store, screenPosition: [x, y], viewportId: viewport.viewportId! });
                }}>
                </graphics-viewport>
                <graphics-viewport style="border: 1px solid red;" .initialCamera=${{ position: [5, 3, -5], target: [0, 0, 0] }} .clearColor=${[0.0, 0.0, 0.0, 0.0] as const}
                @pointermove=${(e: PointerEvent) => {
                    const viewport = (e.target as GraphicsViewport);
                    const bounds = viewport.getBoundingClientRect();
                    const x = e.clientX - bounds.left;
                    const y = e.clientY - bounds.top;
                    const entity = pickFromViewport({ store: this.service.store, screenPosition: [x, y], viewportId: viewport.viewportId! });
                }}>
                >
                </graphics-viewport>
            </div>
        `;
    }
}
