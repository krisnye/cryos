import { html, type TemplateResult } from "lit";

type RenderArgs = {
    clickButton: () => void;
};

export const render = (props: RenderArgs): TemplateResult => {
    return html`
        <div class="toolbar" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            gap: 8px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            pointer-events: auto;
        ">
            <sl-tooltip content="Test Action">
                <sl-icon-button 
                    name="gear"
                    label="Test Action"
                    @click=${props.clickButton}
                ></sl-icon-button>
            </sl-tooltip>
        </div>
    `;
};

