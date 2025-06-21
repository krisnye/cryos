import { createObservableState, toPromise } from "@adobe/data/observe";
import { MainService } from "./services/database.js";
import { ServiceApplication } from "@adobe/data/lit";
import { html, css, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("cryos-service-sample")
export class ServiceSample extends ServiceApplication<MainService> {

    protected override async createService(): Promise<MainService> {
        const [name, setName] = createObservableState("service");
        const [counter, setCounter] = createObservableState<number>(0);
        return {
            serviceName: "main-service",
            name,
            setName,
            counter,
            increment: async () => {
                const currentCount = await toPromise(counter);
                setCounter(currentCount + 1);
            },
            dispose: () => {
            }
        };
    }

    protected override render() {
        if (!this.service) {
            return html`<div>No service</div>`;
        }
        return html`
            <div>
                <div @click=${() => {
                    this.service.setName("New Name")
                }}>
                    Service Sample Application
                </div>
                <div>
                    <button @click=${() => this.service.increment()}>Increment Counter</button>
                </div>
                <cryos-service-sample-child></cryos-service-sample-child>
            </div>
        `;
    }

}