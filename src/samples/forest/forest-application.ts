import { customElement } from "lit/decorators.js";
import { html, css, CSSResult, TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { pickFromViewport } from "../../graphics/picking/pick-from-viewport.js";
import { GraphicsViewport } from "../../graphics/elements/graphics-viewport.js";
import "../../graphics/elements/graphics-viewport.js";
import { createForestService, ForestService } from "./forest-service.js";

// UI Component
export const tagName = "forest-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: ForestApplication;
    }
}

@customElement(tagName)
export class ForestApplication extends ApplicationElement<ForestService> {
    constructor() {
        super();
        this.service = createForestService();
    }

    static override styles: CSSResult = css`
        .forest-container {
            background-color: beige;
        }
    `;

    private handlePointerMove = (e: PointerEvent) => {
        const viewport = e.target as GraphicsViewport;
        const bounds = viewport.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        const entity = pickFromViewport({ 
            store: this.service.store, 
            screenPosition: [x, y], 
            viewportId: viewport.viewportId! 
        });
        
        // Log picked entity for debugging
        if (entity !== undefined) {
            console.log("Picked entity:", entity);
        }
    };

    override render(): TemplateResult {
        return html`
            <div class="forest-container">
                <div>Forest Sample</div>
                <graphics-viewport 
                    style="border: 1px solid green;" 
                    .initialCamera=${{ position: [0, -72, 33], target: [0, 0, 3] }} 
                    .clearColor=${[0.0, 0.0, 0.0, 0.0] as const}
                    @pointermove=${this.handlePointerMove}>
                </graphics-viewport>
            </div>
        `;
    }
}
