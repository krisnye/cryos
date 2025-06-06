import { TwixtElement } from "../../twixt-element";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { boardSize } from "../../dependent-state/board-size";
import { indexToCoords } from "../../utils/coordinates";
import { BoardLink } from "../../services/state-service/create-state-service";
import { currentPlayer } from "samples/twixt/dependent-state/current-player";

@customElement("twixt-link")
export class TwixtLink extends TwixtElement {
    static override styles = css`
        :host {
            position: absolute;
            pointer-events: none;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
        }
        .line {
            position: absolute;
            background: currentColor;
            transform-origin: left center;
            height: 2%;
            border-radius: 1%;
        }
        .red {
            color: #ff4444;
        }
        .black {
            color: #444444;
        }
        .potential {
            opacity: 0.5;
        }
    `;

    @property({ type: Array })
    link: BoardLink = [0, 0];

    @property({ type: Boolean })
    isPotential = false;

    protected override render() {
        const values = useObservableValues(() => ({
            size: boardSize(this.service),
            currentPlayer: currentPlayer(this.service),
        }));

        if (!values) return;

        const [from, to] = this.link;
        const fromCoords = indexToCoords(from, values.size);
        const toCoords = indexToCoords(to, values.size);

        // Calculate line position and rotation using percentages
        const x1 = (fromCoords[0] / values.size) * 100;
        const y1 = (fromCoords[1] / values.size) * 100;
        const x2 = (toCoords[0] / values.size) * 100;
        const y2 = (toCoords[1] / values.size) * 100;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Get the color based on either the current player (for potential links) or the from point's value
        const colorClass = this.isPotential 
            ? (values.currentPlayer === "red" ? "red" : "black")
            : (this.service.state.resources.board[from] === "red" ? "red" : "black");

        return html`
            <div class="line ${colorClass} ${this.isPotential ? 'potential' : ''}"
                style="
                    left: ${x1}%;
                    top: ${y1}%;
                    width: ${length}%;
                    transform: rotate(${angle}deg);
                "
            ></div>
        `;
    }
} 