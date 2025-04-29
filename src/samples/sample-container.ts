import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "./service-sample";

@customElement("cryos-sample-container")
export class SampleContainer extends LitElement {
    override render() {
        return html`
            <h1>Sample Container</h1>
            <cryos-service-sample></cryos-service-sample>
        `;
    }
}
