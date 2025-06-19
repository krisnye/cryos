import { ServiceApplication } from "@adobe/data/lit";
import { MainService } from "./services/main-service/main-service";
import { createMainService } from "./services/main-service/create-main-service";
import { customElement } from "lit/decorators.js";
import { html, css } from "lit";
import "./elements";

@customElement("twixt-game")
export class TwixtGame extends ServiceApplication<MainService> {
    static override styles = css`
        .rules-link {
            position: absolute;
            top: 1rem;
            right: 2rem;
            z-index: 10;
            font-size: 1rem;
            color: #1976d2;
            text-decoration: underline;
            background: none;
            border: none;
            border-radius: 0;
            box-shadow: none;
            padding: 0;
            font-weight: 500;
            cursor: pointer;
            transition: color 0.2s;
        }
        .rules-link:hover {
            color: #0d47a1;
            text-decoration: underline;
            background: none;
        }
        .game-container {
            position: relative;
        }
    `;

    protected override async createService(): Promise<MainService> {
        return createMainService();
    }

    protected override render() {
        return html`
            <div class="game-container">
                <a
                    class="rules-link"
                    href="https://www.ultraboardgames.com/twixt/game-rules.php"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Twixt Rules
                </a>
                <twixt-turn-indicator></twixt-turn-indicator>
                <twixt-board></twixt-board>
            </div>
        `;
    }
}
