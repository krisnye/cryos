import { customElement } from "lit/decorators.js";
import { css, html } from "lit";
import { VoxelElement } from "../voxel-element.js";
import "./particle-labels.js";

@customElement("voxel-canvas-overlay")
export class CanvasOverlay extends VoxelElement {

    static override styles = [
        css`
            :host {
                position: relative;
            }
        `
    ];

    override render() {
        return html`
            <voxel-particle-labels></voxel-particle-labels>
        `;
    }

}
