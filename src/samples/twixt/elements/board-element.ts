import { TwixtElement } from "../twixt-element";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { boardSize } from "../dependent-state/board-size";

@customElement("board-element")
export class BoardElement extends TwixtElement {

    protected override render() {
        const values = useObservableValues(() => ({
            size: boardSize(this.service!),
        }));

        if (!values)
            return html`<div>Board NO VALUES</div>`;

        return html`
            <div>Board ${values?.size}</div>
        `;
    }
}