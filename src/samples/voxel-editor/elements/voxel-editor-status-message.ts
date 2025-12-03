import { customElement, property } from "lit/decorators.js";
import { html, LitElement, type TemplateResult, css, type CSSResultGroup } from "lit";

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

export type StatusType = 'success' | 'warning' | 'danger' | 'primary';

export const tagName = "voxel-editor-status-message";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: VoxelEditorStatusMessage;
    }
}

@customElement(tagName)
export class VoxelEditorStatusMessage extends LitElement {
    @property({ type: String }) message = '';
    @property({ type: String }) type: StatusType = 'primary';
    @property({ type: Boolean }) visible = false;
    
    private hideTimeout?: number;
    
    static override styles: CSSResultGroup = css`
        :host {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        }
        
        sl-alert {
            margin: 0;
        }
        
        sl-alert::part(base) {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    `;
    
    /**
     * Show a status message that auto-dismisses after 3 seconds.
     */
    show(message: string, type: StatusType = 'primary', duration = 3000): void {
        this.message = message;
        this.type = type;
        this.visible = true;
        this.requestUpdate();
        
        // Clear existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        
        // Auto-hide after duration
        this.hideTimeout = window.setTimeout(() => {
            this.hide();
        }, duration);
    }
    
    hide(): void {
        this.visible = false;
        this.requestUpdate();
    }
    
    override render(): TemplateResult {
        if (!this.visible) {
            return html``;
        }
        
        return html`
            <sl-alert variant=${this.type} open closable @sl-hide=${this.hide}>
                <sl-icon slot="icon" name=${this.getIconName()}></sl-icon>
                ${this.message}
            </sl-alert>
        `;
    }
    
    private getIconName(): string {
        switch (this.type) {
            case 'success':
                return 'check-circle';
            case 'warning':
                return 'exclamation-triangle';
            case 'danger':
                return 'exclamation-octagon';
            default:
                return 'info-circle';
        }
    }
}

// Helper function to show status messages globally
let statusMessageElement: VoxelEditorStatusMessage | null = null;

export const showStatus = (message: string, type: StatusType = 'primary', duration = 3000): void => {
    if (!statusMessageElement) {
        statusMessageElement = document.createElement(tagName) as VoxelEditorStatusMessage;
        document.body.appendChild(statusMessageElement);
    }
    statusMessageElement.show(message, type, duration);
};

