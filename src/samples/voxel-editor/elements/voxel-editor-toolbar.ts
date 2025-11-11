import { customElement } from "lit/decorators.js";
import { type TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { VoxelEditorService } from "../voxel-editor-service.js";
import * as presentation from './voxel-editor-toolbar-presentation.js';

// Import Shoelace theme and components
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// Set the base path to the Shoelace assets (for icons, etc.)
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.19.1/cdn/');

export const tagName = "voxel-editor-toolbar";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VoxelEditorToolbar;
    }
}

@customElement(tagName)
export class VoxelEditorToolbar extends ApplicationElement<VoxelEditorService> {
    override render(): TemplateResult {
        return presentation.render({
            clickButton: () => console.log('Toolbar button clicked!'),
        });
    }
}

