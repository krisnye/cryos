import { TwixtElement } from "../twixt-element";
import { html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("board-element")
export class BoardElement extends TwixtElement {

    protected override render() {
        
        return html`
            <div>Board</div>
        `;
    }
}