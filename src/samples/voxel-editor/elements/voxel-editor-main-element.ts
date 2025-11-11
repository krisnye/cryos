import { customElement } from "lit/decorators.js";
import { TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { createVoxelEditorService, VoxelEditorService } from "../voxel-editor-service.js";
import "../../../graphics/elements/graphics-viewport.js";
import "./voxel-editor-toolbar.js";
import * as presentation from './voxel-editor-main-element-presentation.js';

// UI Component
export const tagName = "voxel-editor-application";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VoxelEditorApplication;
    }
}

@customElement(tagName)
export class VoxelEditorApplication extends ApplicationElement<VoxelEditorService> {
    constructor() {
        super();
        this.service = createVoxelEditorService();
    }

    override render(): TemplateResult {
        return presentation.render({
            ...this.service.database.transactions,
        });
    }
}

