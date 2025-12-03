import { html, type TemplateResult } from "lit";
import { materials } from "physics/basic-materials.js";
import { MaterialIndex } from "physics/material.js";

type RenderArgs = {
    selectedMaterial: MaterialIndex;
    selectMaterial: (material: MaterialIndex) => void;
};

export const render = (props: RenderArgs): TemplateResult => {
    return html`
        <div class="material-palette" style="
            position: absolute;
            top: 60px;
            left: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 0;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            pointer-events: auto;
            min-width: 48px;
            overflow-y: auto;
            overflow-x: hidden;
        ">
            ${materials.map((material) => {
                const isSelected = props.selectedMaterial === material.index;
                const [r, g, b, a] = material.color;
                const rgbColor = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
                
                return html`
                    <sl-tooltip content="${material.name}" placement="right">
                        <button
                            @click=${() => props.selectMaterial(material.index)}
                            style="
                                width: 48px;
                                height: 48px;
                                border: ${isSelected ? '3px solid white' : '2px solid rgba(255, 255, 255, 0.3)'};
                                border-radius: 4px;
                                background: ${rgbColor};
                                cursor: pointer;
                                transition: all 0.2s;
                                box-shadow: ${isSelected ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none'};
                                opacity: ${a < 0.5 ? 0.7 : 1.0};
                                position: relative;
                                display: flex;
                                align-items: flex-end;
                                justify-content: center;
                                padding: 2px;
                                overflow: hidden;
                            "
                            @mouseenter=${(e: MouseEvent) => {
                                const target = e.currentTarget as HTMLElement;
                                target.style.transform = 'scale(1.1)';
                            }}
                            @mouseleave=${(e: MouseEvent) => {
                                const target = e.currentTarget as HTMLElement;
                                target.style.transform = 'scale(1.0)';
                            }}
                        >
                            ${a < 0.5 ? html`
                                <div style="
                                    position: absolute;
                                    inset: 0;
                                    background: repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 4px,
                                        rgba(128, 128, 128, 0.3) 4px,
                                        rgba(128, 128, 128, 0.3) 8px
                                    );
                                    pointer-events: none;
                                "></div>
                            ` : ''}
                            <div style="
                                font-size: 10px;
                                font-weight: 600;
                                color: black;
                                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
                                text-align: center;
                                line-height: 1.1;
                                pointer-events: none;
                                z-index: 1;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                                hyphens: auto;
                                max-width: 100%;
                            ">${material.name}</div>
                        </button>
                    </sl-tooltip>
                `;
            })}
        </div>
    `;
};

