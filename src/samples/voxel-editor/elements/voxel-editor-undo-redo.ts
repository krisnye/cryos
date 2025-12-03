import { customElement } from "lit/decorators.js";
import { type TemplateResult } from "lit";
import { ApplicationElement, useEffect, useObservableValues } from "@adobe/data/lit";
import { VoxelEditorService } from "../voxel-editor-service.js";
import * as presentation from "./voxel-editor-undo-redo-presentation.js";

export const tagName = "voxel-editor-undo-redo";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VoxelEditorUndoRedo;
    }
}

@customElement(tagName)
export class VoxelEditorUndoRedo extends ApplicationElement<VoxelEditorService> {
    override render(): TemplateResult | undefined {
        const values = useObservableValues(() => ({
            hasUndo: this.service.undoRedo.undoEnabled,
            hasRedo: this.service.undoRedo.redoEnabled,
        }));

        useEffect(() => {
            this.service.undoRedo.undoStack((stack) => {
                console.log("undo stack", stack);
            });
            this.service.database.observe.transactions(t => {
                console.log("transaction", t);
            })
            for (const entity of [23,24,25,26]) {
                this.service.database.observe.entity(entity)((values) => {
                    console.log(`entity ${entity} changed`, values);
                });
            }
        }, []);

        if (!values) return;

        return presentation.render({
            ...values,
            undo: () => this.service.undoRedo.undo(),
            redo: () => this.service.undoRedo.redo(),
        });
    }
}

