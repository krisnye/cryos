import { TwixtElement } from "../../twixt-element";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BoardLink } from "../../services/state-service/create-state-service";
import "../twixt-link";

@customElement("twixt-links")
export class TwixtLinks extends TwixtElement {
    static override styles = css`
        :host {
            position: absolute;
            top: 8px;
            left: 17px;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
    `;

    @property({ type: Array })
    links: BoardLink[] = [];

    protected override render() {
        return html`
            ${this.links.map(link => html`
                <twixt-link .link=${link}></twixt-link>
            `)}
        `;
    }
} 