import { TwixtElement } from "../twixt-element";
import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("twixt-point")
export class TwixtPoint extends TwixtElement {
    @property({ type: Number })
    index = 0;

    @property({ type: Boolean, reflect: true })
    selected = false;

    protected override render() {
        return html`
            <div class="point" @click=${this.handleClick}>
                ${this.selected ? "●" : "○"}
            </div>
        `;
    }

    private handleClick() {
        // TODO: Handle point selection
        this.selected = !this.selected;
    }
} 