import { customElement } from "lit/decorators.js";
import { MainService } from "../services/database";
import { ServiceElement } from "ui/elements";
import { html } from "lit";
import { withHooks } from "ui/hooks/with-hooks";
import { useObservableValues } from "ui/hooks/use-observable-values";

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
