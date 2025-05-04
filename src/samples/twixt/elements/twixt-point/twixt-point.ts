import { TwixtElement } from "../../twixt-element";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { boardPointValue } from "../../dependent-state/board-point-value";
import { clickPoint } from "../../actions/click-point";
import redCircle from "./red-circle.svg";
import blackCircle from "./black-circle.svg";
import { boardPointHover } from "../../dependent-state/board-point-hover";

@customElement("twixt-point")
export class TwixtPoint extends TwixtElement {
    static override styles = css`
        .point {
            aspect-ratio: 1;
            display: grid;
            place-items: center;
            cursor: not-allowed;
            user-select: none;
        }
        .circle {
            width: 1.5em;
            height: 1.5em;
        }
        .hover {
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
            value: boardPointValue(this.service!, this.index),
            hover: boardPointHover(this.service!, this.index),
        }));

        if (!values)
            return;

        const displayValue = values.value ?? values.hover;
        const isHover = values.value === null && values.hover !== null;

        return html`
            <div class=${"point" + (isHover ? " hover" : "") + (values.value ? "" : " enabled")}
                @click=${() => clickPoint(this.service!, this.index)}
                @mouseenter=${() => this.service!.state.resources.hoverIndex = this.index}
                @mouseleave=${() => this.service!.state.resources.hoverIndex = null}
            >
                ${displayValue === null 
                    ? "○" 
                    : html`<img 
                        class="circle" 
                        src=${displayValue === "red" ? redCircle : blackCircle} 
                        alt=${displayValue} 
                    />`}
            </div>
        `;
    }
} 