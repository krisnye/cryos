import { html, type TemplateResult } from "lit";

type RenderArgs = {
    filename: string;
    isDirty: boolean;
    newModel: () => void;
    openModel: () => void;
    saveModel: () => void;
};

export const render = (props: RenderArgs): TemplateResult => {
    return html`
        <div class="toolbar" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            pointer-events: auto;
        ">
            <sl-button-group>
                <sl-button size="small" @click=${props.newModel}>
                    <sl-icon slot="prefix" name="file-earmark-plus"></sl-icon>
                    New
                </sl-button>
                <sl-button size="small" @click=${props.openModel}>
                    <sl-icon slot="prefix" name="folder-open"></sl-icon>
                    Open
                </sl-button>
                <sl-button size="small" @click=${props.saveModel} variant=${props.isDirty ? 'primary' : 'default'}>
                    <sl-icon slot="prefix" name="floppy"></sl-icon>
                    Save
                </sl-button>
            </sl-button-group>
            
            <voxel-editor-undo-redo></voxel-editor-undo-redo>
            
            <div style="
                font-family: var(--sl-font-sans);
                font-size: 14px;
                font-weight: 500;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            ">
                ${props.filename}${props.isDirty ? html`<span style="color: #ff6b6b; margin-left: 4px;">*</span>` : ''}
            </div>
        </div>
    `;
};

