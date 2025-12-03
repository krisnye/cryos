import { customElement } from "lit/decorators.js";
import { type TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { VoxelEditorService } from "../voxel-editor-service.js";
import * as presentation from './voxel-editor-material-palette-presentation.js';

// Import Shoelace components needed for tooltips
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

export const tagName = "voxel-editor-material-palette";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VoxelEditorMaterialPalette;
    }
}

@customElement(tagName)
export class VoxelEditorMaterialPalette extends ApplicationElement<VoxelEditorService> {
    override render(): TemplateResult {
        return presentation.render({
            selectedMaterial: this.service.store.resources.selectedMaterial,
            selectMaterial: (material) => {
                this.service.database.transactions.setSelectedMaterial(material);
            },
        });
    }
}

