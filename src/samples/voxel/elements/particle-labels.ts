import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { VoxelElement } from "../voxel-element.js";
import { useObservableValues } from "@adobe/data/lit";
import { repeat } from "lit/directives/repeat.js";
import "./particle-label.js";

@customElement("voxel-particle-labels")
export class ParticleLabels extends VoxelElement {

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
                    (item) => html`<voxel-particle-label .entity=${item.id} .label=${item.label}></voxel-particle-label>`
                )}
            </div>
        `;
    }
} 