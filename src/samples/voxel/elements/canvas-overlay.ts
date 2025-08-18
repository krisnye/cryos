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

        // Get all labeled particles from both archetypes
        const labeledParticles: Array<{ id: number, label: string }> = [];
        
        // Check LabeledParticle archetype
        for (const archetype of this.service.database.queryArchetypes(["position_scale", "label"])) {
            for (let i = 0; i < archetype.rowCount; i++) {
                const id = archetype.columns.id.get(i);
                const label = archetype.columns.label.get(i);
                labeledParticles.push({ id, label });
            }
        }

        return html`
            <div>
                ${repeat(
                    labeledParticles,
                    (item) => `${item.id}`,
                    (item) => html`<voxel-particles-label .entity=${item.id} .label=${item.label}></voxel-particles-label>`
                )}
            </div>
        `;
    }

}
