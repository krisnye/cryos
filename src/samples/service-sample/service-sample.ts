import { createObservableState } from "data/observe/create-observable-state";
import { MainService } from "./services/database";
import { ServiceApplication } from "ui/elements";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { toPromise } from "data/observe";

@customElement("cryos-service-sample")
export class ServiceSample extends ServiceApplication<MainService> {

    protected override async createService(): Promise<MainService> {
        const [name, setName] = createObservableState("service");
        const [counter, setCounter] = createObservableState<number>(0);
        return {
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
                    console.log("SETNAME");
                    this.service!.setName("New Name")
                }}>
                    Service Sample Application
                </div>
                <div>
                    <button @click=${() => this.service!.increment()}>Increment Counter</button>
                </div>
                <cryos-service-sample-child></cryos-service-sample-child>
            </div>
        `;
    }

}