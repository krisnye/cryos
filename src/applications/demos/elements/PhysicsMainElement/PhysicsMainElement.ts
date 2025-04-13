import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { withHooks } from '../../../../hooks/withHooks.js';
import { type MainService } from '../../services/MainService.js';
import { createMainService } from '../../services/createMainService.js';
import { useEffect } from '../../../../hooks/useEffect.js';

const tagName = "physics-main";
@customElement(tagName)
export class PhysicsMainElement extends LitElement {
    static styles = css`
        :host {
            display: block;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }

        canvas {
            border: 1px solid #ccc;
            background: #000;
        }

        h2 {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    `;

    @property({ type: Object })
    service!: MainService;

    async firstUpdated() {
        const canvas = this.shadowRoot?.querySelector('canvas')!;
        this.service = await createMainService(canvas);
        this.service.animateFrame();
    }

    @withHooks
    render() {
        return html`
            <h2>Physics and Rendering Demo</h2>
            <canvas
                tabindex="0"
                autofocus
                width="600"
                height="400"
                @click=${(event: MouseEvent) => this.service.click(event)}
                @keydown=${(event: KeyboardEvent) => this.service.keydown(event.key)}
                @keyup=${(event: KeyboardEvent) => this.service.keyup(event.key)}
                @blur=${() => this.service.blur()}
            ></canvas>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: PhysicsMainElement;
    }
}
