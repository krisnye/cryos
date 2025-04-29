import { createObservableState } from "data/observe/create-observable-state";
import { MainService } from "./services/main-service";
import { ServiceApplication } from "ui/elements";
import { html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("cryos-service-sample")
export class ServiceSample extends ServiceApplication<MainService> {

    protected override async createService(): Promise<MainService> {
        const [name, setName] = createObservableState("service");
        return {
            name,
            setName,
            dispose: () => {
            }
        };
    }

    protected override render() {
        if (!this.service) {
            return html`<div>No service</div>`;
        }
        return html`
            <div @click=${() => {
                console.log("SETNAME");
                this.service!.setName("New Name")
            }}>
                Service Sample Application
                <cryos-service-sample-child></cryos-service-sample-child>
            </div>
        `;
    }

}