import { ServiceApplication } from "ui/elements";
import { MainService } from "./services/main-service/main-service";
import { createMainService } from "./services/main-service/create-main-service";
import { customElement } from "lit/decorators.js";
import { html } from "lit";
import "./elements";

@customElement("twixt-game")
export class TwixtGame extends ServiceApplication<MainService> {

    protected override async createService(): Promise<MainService> {
        return createMainService();
    }

    protected override render() {
        return html`
            Hello Twixt Game!
            <twixt-board></twixt-board>
        `;
    }
}
