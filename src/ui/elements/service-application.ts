import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { provide } from "@lit/context";
import { serviceContext } from "./service-context";
import { Service } from "services";

export abstract class ServiceApplication<S extends Service> extends LitElement {

    @provide({context: serviceContext})
    @property({type: Object})
    protected service?: S;

    protected abstract createService(): Promise<S>;

    override async connectedCallback() {
        super.connectedCallback();
        this.service = await this.createService();
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this.service?.dispose();
    }

}
