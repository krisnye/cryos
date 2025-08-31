import { TwixtElement } from "../twixt-element.js";
import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { useObservableValues } from "@adobe/data/lit";
import redCircle from "../assets/red-circle.svg";
import blackCircle from "../assets/black-circle.svg";

@customElement("twixt-turn-indicator")
export class TwixtTurnIndicator extends TwixtElement {
    static override styles = css`
        :host {
            display: block;
            width: 100%;
            text-align: center;
            margin-bottom: 1rem;
            height: 5rem;
        }
        .turn-indicator {
            display: inline-flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 1.5rem;
            font-size: 1.2rem;
            background: #f5f5f5;
            border-radius: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 100%;
        }
        .winner-indicator {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem 1.5rem;
            background: #f5f5f5;
            border-radius: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 100%;
        }
        .winner-text {
            font-size: 2rem;
            font-weight: bold;
            color: #1976d2;
            line-height: 1;
        }
        .circle {
            width: 2em;
            height: 2em;
        }
        .reset-button {
            padding: 0.5rem 1rem;
            font-size: 1rem;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .reset-button:hover {
            background: #1565c0;
        }
    `;

    override render() {
        const values = useObservableValues(() => ({
            player: this.service.state.observe.currentPlayer,
            winner: this.service.state.observe.winner,
        }));

        if (!values) return;

        if (values.winner) {
            return html`
                <div class="winner-indicator">
                    <div class="winner-text">
                        ${values.winner.toUpperCase()} WINS!
                    </div>
                    <button 
                        class="reset-button"
                        @click=${() => this.service.state.database.transactions.newGame()}
                    >
                        New Game
                    </button>
                </div>
            `;
        }

        return html`
            <div class="turn-indicator">
                <span>Current Turn:</span>
                <img 
                    class="circle" 
                    src=${values.player === "red" ? redCircle : blackCircle} 
                    alt=${values.player} 
                />
            </div>
        `;
    }
} 