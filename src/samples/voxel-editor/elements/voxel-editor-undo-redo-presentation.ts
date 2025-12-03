import { TransactionResult } from "@adobe/data/ecs";
import { html, type TemplateResult } from "lit";

type RenderArgs = {
    hasUndo: boolean;
    hasRedo: boolean;
    undo: () => void;
    redo: () => void;
};

export const render = (args: RenderArgs): TemplateResult => {
    const { hasUndo, hasRedo, undo, redo } = args;

    return html`
        <div style="display: flex; gap: 4px;">
            <sl-tooltip content="Undo (Ctrl+Z)">
                <sl-icon-button 
                    name="arrow-counterclockwise"
                    @click=${undo}
                    ?disabled=${!hasUndo}
                    label="Undo"
                ></sl-icon-button>
            </sl-tooltip>
            <sl-tooltip content="Redo (Ctrl+Y)">
                <sl-icon-button 
                    name="arrow-clockwise"
                    @click=${redo}
                    ?disabled=${!hasRedo}
                    label="Redo"
                ></sl-icon-button>
            </sl-tooltip>
        </div>
    `;
};

