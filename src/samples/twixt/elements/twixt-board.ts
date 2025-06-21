import { TwixtElement } from "../twixt-element.js";
import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { useObservableValues } from "@adobe/data/lit";
import "./twixt-point";
import "./twixt-links";

const range = (size: number) => Array.from({ length: size }, (_, i) => i);

@customElement("twixt-board")
export class TwixtBoard extends TwixtElement {
    static override styles = css`
        .board-container {
            display: grid;
            position: relative;
        }
    `;

    protected override render() {
        const values = useObservableValues(() => ({
            size: this.service.state.observe.boardSize,
            links: this.service.state.database.observe.resource.links,
        }));

        if (!values)
            return;

        return html`
            <div class="board-container" style="grid-template-columns: repeat(${values.size}, 1fr);">
                ${[...range(values.size * values.size)].map(index => html`
                    <twixt-point .index=${index}></twixt-point>
                `)}
                <twixt-links .links=${values.links}></twixt-links>
            </div>
        `;
    }
}