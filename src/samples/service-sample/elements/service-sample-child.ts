import { customElement } from "lit/decorators.js";
import { MainService } from "../services/database";
import { withHooks, useObservableValues, ServiceElement } from "@adobe/data/lit";
import { html } from "lit";

@customElement("cryos-service-sample-child")
export class ServiceSampleChild extends ServiceElement<MainService> {

    @withHooks
    protected override render() {
        const service = this.service;
        if (!service) {
            return html`<div>No service</div>`;
        }
        const values = useObservableValues(() => ({
            name: service.name,
            counter: service.counter
        }));
        return html`
            <div>
                <div>Service Sample Child: ${values?.name ?? "unknown"}</div>
                <div>Counter: ${values?.counter ?? 0}</div>
            </div>
        `;
    }
}
