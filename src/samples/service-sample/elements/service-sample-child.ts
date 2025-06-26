import { customElement } from "lit/decorators.js";
import { withHooks, useObservableValues } from "@adobe/data/lit";
import { html } from "lit";
import { ServiceSampleElement } from "../service-sample-element.js";

@customElement("service-sample-main-element-child")
export class ServiceSampleChild extends ServiceSampleElement {

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
