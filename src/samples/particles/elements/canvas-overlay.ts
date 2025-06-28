import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { ParticlesElement } from "../particles-element.js";
import "./particles-label.js";
import { useMemo, useObservableValues } from "@adobe/data/lit";
import { repeat } from "lit/directives/repeat.js";

@customElement("canvas-overlay")
export class CanvasOverlay extends ParticlesElement {

    static override styles = [
        css`
            :host {
                position: relative;
            }
        `
    ];

    override render() {
        const values = useObservableValues(() => ({
            renderFrame: this.service.database.observe.resource.renderFrame
        }));

        const particles = useMemo(() => this.service.store.ensureArchetype(["id", "particle", "velocity", "boundingBox"]));

        return html`
            <div>
                ${repeat(
                    Array.from({ length: particles.rows }, (_, i) => i),
                    (index) => index,
                    (index) => html`<particles-label .particleIndex=${index}></particles-label>`
                )}
            </div>
        `;
    }

}
