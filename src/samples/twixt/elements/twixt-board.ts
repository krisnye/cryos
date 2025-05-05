import { TwixtElement } from "../twixt-element";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { boardSize } from "../dependent-state/board-size";
import { range } from "data/functions/range";
import "./twixt-point";
import "./twixt-links";

@customElement("twixt-board")
export class TwixtBoard extends TwixtElement {
    protected override render() {
        const values = useObservableValues(() => ({
            size: boardSize(this.service!),
            links: this.service!.state.observe.links,
        }));

        if (!values)
            return;

        return html`
            <div class="board" style="display: grid; grid-template-columns: repeat(${values.size}, 1fr); gap: 4px; position: relative;">
                ${[...range(values.size * values.size)].map(index => html`
                    <twixt-point .index=${index}></twixt-point>
                `)}
                <twixt-links .links=${values.links}></twixt-links>
            </div>
        `;
    }
}