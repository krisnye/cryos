import { customElement, property } from "lit/decorators.js";
import { css, html } from "lit";
import { ParticlesElement } from "../particles-element.js";
import { worldToScreen } from "graphics/camera/world-to-screen.js";
import { useEffect } from "@adobe/data/lit";
import * as VEC3 from "math/vec3/index.js";

@customElement("voxel-particles-label")
export class ParticlesLabel extends ParticlesElement {

    @property({ type: String })
    archetype = '';

    @property({ type: Number })
    particleIndex = 0;

    @property({ type: String })
    labelText = '';

    static override styles = [
        css`
            :host {
                position: absolute;
                pointer-events: none;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 3px 8px;
                border: white solid 2px;
                border-radius: 8px;
                font-size: 14px;
                font-family: monospace;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                /* Optimize for frequent movement */
                will-change: transform, left, top, z-index;
                /* Force hardware acceleration */
                backface-visibility: hidden;
            }
        `
    ];

    override render() {
        // Get the appropriate archetype based on the archetype property
        const particles = this.service.database.archetypes[this.archetype as keyof typeof this.service.database.archetypes] as any;
        
        useEffect(() => {
            return this.service.database.observe.resources.renderFrame(() => {
                const position_scale = particles.columns.position_scale.get(this.particleIndex);
                const position: VEC3.Vec3 = [position_scale[0], position_scale[1], position_scale[2]];
                // Position label slightly offset from the particle for better visibility
                const labelOffset = VEC3.add(position, [0.6, 0.6, 0.6]);
                const [screenX, screenY, depth] = worldToScreen(
                    labelOffset,
                    this.service.store.resources.camera,
                    this.service.store.resources.graphics.canvas.width,
                    this.service.store.resources.graphics.canvas.height
                );

                // Check if particle is behind camera
                if (depth >= 2) {
                    this.style.display = 'none';
                    return;
                }

                const zIndex = Math.round(depth * 1000000); // Scale depth to z-index range

                this.style.left = `${screenX}px`;
                this.style.top = `${screenY}px`;
                this.style.zIndex = `${zIndex}`;
                this.style.display = 'block';
            })
        })
        return html`${this.labelText}`;
    }

}
