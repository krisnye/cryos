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
        const labeledParticles: Array<{ archetype: string, index: number, label: string }> = [];
        
        // Check LabeledParticle archetype
        const labeledArchetype = this.service.database.archetypes.LabeledParticle;
        for (let i = 0; i < labeledArchetype.rowCount; i++) {
            const label = labeledArchetype.columns.label.get(i);
            labeledParticles.push({ archetype: 'LabeledParticle', index: i, label });
        }

        return html`
            <div>
                ${repeat(
                    labeledParticles,
                    (item) => `${item.archetype}-${item.index}`,
                    (item) => html`<voxel-particles-label 
                        .archetype=${item.archetype} 
                        .particleIndex=${item.index}
                        .labelText=${item.label}>
                    </voxel-particles-label>`
                )}
            </div>
        `;
    }

}
