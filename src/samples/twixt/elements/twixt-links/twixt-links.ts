import { TwixtElement } from "../../twixt-element.js";
import { css, html, type CSSResult, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { useObservableValues } from "@adobe/data/lit";
import { calculateNewLinks } from "../../functions/index.js";
import "../twixt-link";
import { BoardLink } from "../../services/index.js";

@customElement("twixt-links")
export class TwixtLinks extends TwixtElement {
    static override styles: CSSResult = css`
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

    override render(): TemplateResult {
        const values = useObservableValues(() => ({
            hoverIndex: this.service.state.database.observe.resources.hoverIndex,
            currentPlayer: this.service.state.observe.currentPlayer,
        }));

        if (!values) return html``;

        const potentialLinks = values.hoverIndex !== null && values.currentPlayer
            ? calculateNewLinks(
                values.currentPlayer,
                values.hoverIndex,
                this.service.state.database.resources.board,
                this.links
            )
            : [];

        return html`
            ${this.links.map(link => html`
                <twixt-link .link=${link}></twixt-link>
            `)}
            ${potentialLinks.map(link => html`
                <twixt-link .link=${link} .isPotential=${true}></twixt-link>
            `)}
        `;
    }
} 