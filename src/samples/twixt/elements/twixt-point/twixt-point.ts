import { TwixtElement } from "../../twixt-element";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { boardPointValue } from "../../dependent-state/board-point-value";
import { clickPoint } from "../../actions/click-point";
import redCircle from "../../assets/red-circle.svg";
import blackCircle from "../../assets/black-circle.svg";
import { boardPointHover } from "../../dependent-state/board-point-hover";
import { boardSize } from "../../dependent-state/board-size";
import { currentPlayer } from "../../dependent-state/current-player";
import { winner } from "samples/twixt/dependent-state/winner";

const isCornerPoint = (index: number, size: number): boolean => {
    const x = index % size;
    const y = Math.floor(index / size);
    return (x === 0 || x === size - 1) && (y === 0 || y === size - 1);
};

const getEdgeBorderStyle = (index: number, size: number): string => {
    const x = index % size;
    const y = Math.floor(index / size);
    let style = "";
    // Top edge (not corner)
    if (y === 0 && x > 0 && x < size - 1) {
        style += "border-bottom: 4px solid #ff4444;";
    }
    // Bottom edge (not corner)
    if (y === size - 1 && x > 0 && x < size - 1) {
        style += "border-top: 4px solid #ff4444;";
    }
    // Left edge (not corner)
    if (x === 0 && y > 0 && y < size - 1) {
        style += "border-right: 4px solid #444444;";
    }
    // Right edge (not corner)
    if (x === size - 1 && y > 0 && y < size - 1) {
        style += "border-left: 4px solid #444444;";
    }
    return style;
};

const isValidMove = (index: number, size: number, value: string | null, player: string): boolean => {
    if (value !== null) return false;
    const x = index % size;
    const y = Math.floor(index / size);
    // Left or right edge (not corner): only black
    if ((x === 0 || x === size - 1) && y > 0 && y < size - 1) {
        return player === "black";
    }
    // Top or bottom edge (not corner): only red
    if ((y === 0 || y === size - 1) && x > 0 && x < size - 1) {
        return player === "red";
    }
    // All other points (not edge or corner)
    if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
        return true;
    }
    // Corners are not valid
    return false;
};

@customElement("twixt-point")
export class TwixtPoint extends TwixtElement {
    static override styles = css`
        .point {
            aspect-ratio: 1;
            display: grid;
            place-items: center;
            cursor: not-allowed;
            user-select: none;
            box-sizing: border-box;
        }
        .circle {
            width: 1.5em;
            height: 1.5em;
        }
        .content-hover {
            opacity: 0.5;
        }
        .enabled {
            cursor: pointer; 
        }
    `;

    @property({ type: Number })
    index = 0;

    protected override render() {
        const values = useObservableValues(() => ({
            value: boardPointValue(this.service, this.index),
            hover: boardPointHover(this.service, this.index),
            size: boardSize(this.service),
            player: currentPlayer(this.service),
            winner: winner(this.service),
        }));

        if (!values)
            return;

        // Don't render corner points
        if (isCornerPoint(this.index, values.size)) {
            return html``;
        }

        const validMove = values.winner === null && isValidMove(this.index, values.size, values.value, values.player);
        const displayValue = values.value ?? (validMove ? values.hover : null);
        const isHover = values.value === null && values.hover !== null && validMove;
        const borderStyle = getEdgeBorderStyle(this.index, values.size);

        return html`
            <div class=${"point" + (validMove ? " enabled" : "")}
                style=${borderStyle}
                @click=${validMove ? (() => clickPoint(this.service, this.index)) : undefined}
                @mouseenter=${validMove ? (() => this.service.state.resources.hoverIndex = this.index) : undefined}
                @mouseleave=${() => this.service.state.resources.hoverIndex = null}
            >
                <span class=${isHover ? "content-hover" : ""}>
                ${displayValue === null 
                    ? "○" 
                    : html`<img 
                        class="circle" 
                        src=${displayValue === "red" ? redCircle : blackCircle} 
                        alt=${displayValue} 
                    />`}
                </span>
            </div>
        `;
    }
} 