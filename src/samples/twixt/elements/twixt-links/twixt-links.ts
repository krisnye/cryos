import { TwixtElement } from "../../twixt-element";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BoardLink } from "../../services/state-service/create-state-service";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { calculateNewLinks } from "../../functions/calculate-new-links";
import "../twixt-link";
import { currentPlayer } from "samples/twixt/dependent-state/current-player";

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
        const values = useObservableValues(() => ({
            hoverIndex: this.service.state.observe.hoverIndex,
            currentPlayer: currentPlayer(this.service),
        }));

        if (!values) return;

        const potentialLinks = values.hoverIndex !== null && values.currentPlayer
            ? calculateNewLinks(
                this.service,
                values.currentPlayer,
                values.hoverIndex
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