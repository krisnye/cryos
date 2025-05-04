import { TwixtElement } from "../twixt-element";
import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { currentPlayer } from "../dependent-state/current-player";
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
        }
        .circle {
            width: 2em;
            height: 2em;
        }
    `;

    protected override render() {
        const values = useObservableValues(() => ({
            player: currentPlayer(this.service!),
        }));

        if (!values) return;

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