import { customElement, property } from "lit/decorators.js";
import { html, LitElement } from "lit";
import { consume } from "@lit/context";
import { serviceContext } from "@adobe/data/lit";
import { MainService } from "../services/create-main-service.js";

@customElement("particles-label")
export class ParticlesMainElement extends LitElement {

    @consume({context: serviceContext})
    @property({type: Object})
    protected service!: MainService;

    override render() {
        console.log("particles-label render, service:", this.service);
        return html`
            <div>Particle Label</div>
        `;
    }

}
