import { customElement } from "lit/decorators.js";
import { TemplateResult } from "lit";
import { ApplicationElement } from "@adobe/data/lit";
import { createVoxelEditorService, VoxelEditorService } from "../voxel-editor-service.js";
import { useUnsavedChangesWarning } from "../functions/setup-unsaved-changes-warning.js";
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

    private handleKeyDown = (event: KeyboardEvent) => {
        // Check for modifier keys (Command on Mac, Ctrl on Windows/Linux)
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? event.metaKey : event.ctrlKey;
        const key = event.key.toLowerCase();
        
        // Handle undo/redo at the application level (not in transactions)
        if (modifierKey && key === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.service.undoRedo.undo();
            return;
        }
        
        if (modifierKey && (key === 'y' || (key === 'z' && event.shiftKey))) {
            event.preventDefault();
            this.service.undoRedo.redo();
            return;
        }
        
        // Pass other keys to the keyPress transaction
        this.service.database.transactions.keyPress(event);
    };

    override render(): TemplateResult {
        // Setup unsaved changes warning hook
        useUnsavedChangesWarning(this.service);
        
        return presentation.render({
            ...this.service.database.transactions,
            keyPress: this.handleKeyDown,
        });
    }
}

