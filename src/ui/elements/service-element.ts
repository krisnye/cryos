import { LitElement } from "lit";
import { serviceContext } from "./service-context";
import { property } from "lit/decorators.js";
import { Service } from "services";
import { consume } from "@lit/context";
import { applyServiceDecorators } from "../decorators/apply-service-decorators";

export class ServiceElement<S extends Service> extends LitElement {

    @consume({context: serviceContext})
    @property({type: Object})
    protected service!: S;

    override connectedCallback() {
        super.connectedCallback();
        applyServiceDecorators(this);
    }
}