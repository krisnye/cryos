import { withHooks } from "@adobe/data/lit";
import { customElement } from "lit/decorators.js";
import { html, css, type CSSResult, type TemplateResult } from "lit";
import { TwixtElement } from "./twixt-element.js";
import "./elements/index.js";

export const tagName = "twixt-main-element";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: TwixtGame;
    }
}
@customElement(tagName)
export class TwixtGame extends TwixtElement {
    static override styles: CSSResult = css`
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

    @withHooks
    override render(): TemplateResult {
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
