import { customElement } from "lit/decorators.js";
import { TemplateResult } from "lit";
import { ApplicationElement, useObservableValues } from "@adobe/data/lit";
import { createVoxelEditorService, VoxelEditorService } from "../voxel-editor-service.js";
import "../../../graphics/elements/graphics-viewport.js";
import { Vec3 } from "@adobe/data/math";
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
        const values = useObservableValues(() => ({
            modelSize: this.service.store.resources.modelSize,
        }));

        if (!values) return;

        return presentation.render({
            modelSize: values.modelSize,
            clearColor: [0.0, 0.0, 0.0, 0.0] as const,
            keyPress: this.service.database.transactions.keyPress,
            pointerDown: this.service.database.transactions.pointerDown,
            pointerUp: this.service.database.transactions.pointerUp,
            pointerMove: this.service.database.transactions.pointerMove,
        });
    }
}

