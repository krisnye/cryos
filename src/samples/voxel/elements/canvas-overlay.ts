import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { ParticlesElement } from "../particles-element.js";
import { useObservableValues } from "@adobe/data/lit";
import { repeat } from "lit/directives/repeat.js";
import "./particles-label.js";

@customElement("voxel-canvas-overlay")
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
            renderFrame: this.service.database.observe.resources.renderFrame
        }));

        return html`
            <div>
                ${repeat(
                    Array.from({ length: this.service.database.archetypes.Particle.rows }, (_, i) => i),
                    (index) => index,
                    (index) => html`<voxel-particles-label .particleIndex=${index}></voxel-particles-label>`
                )}
            </div>
        `;
    }

}
