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
            // We don't actually need this, but we want to re-render ever frame.
            // really we only need to re-render if the particles entity array changes.
            renderFrame: this.service.database.observe.resources.renderFrame
        }));

        const particles = this.service.database.select(this.service.database.archetypes.Particle.components);

        return html`
            <div>
                ${repeat(
                    particles,
                    (index) => index,
                    (index) => html`<particles-label .particleIndex=${index}></particles-label>`
                )}
            </div>
        `;
    }

}
