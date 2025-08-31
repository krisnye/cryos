import { ApplicationHost } from "@adobe/data/lit";
import { MainService } from "./services/main-service/main-service.js";
import { customElement } from "lit/decorators.js";
import { createMainService } from "./services/main-service/create-main-service.js";
import { html } from "lit";
import "./twixt-main-element.js";

const tagName = "twixt-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: TwixtApplication;
    }
}

@customElement(tagName)
export class TwixtApplication extends ApplicationHost<MainService> {
    constructor() {
        super();
        this.createService = async () => createMainService();
        this.renderElement = () => html`<twixt-main-element></twixt-main-element>`;
    }
}