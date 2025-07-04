import { customElement, property } from "lit/decorators.js";
import { css, html } from "lit";
import { ParticlesElement } from "../particles-element.js";
import { worldToScreen } from "graphics/camera/world-to-screen.js";
import { useEffect } from "@adobe/data/lit";
import * as VEC3 from "math/vec3/index.js";

@customElement("voxel-particles-label")
export class ParticlesLabel extends ParticlesElement {

    @property({ type: Number })
    particleIndex = 0;

    static override styles = [
        css`
            :host {
                position: absolute;
                pointer-events: none;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 2px 6px;
                border: white solid 1px;
                border-radius: 6px;
                border-top-left-radius: 0;
                font-size: 12px;
                font-family: monospace;
                /* transform: translate(-50%, -50%); */
                /* Optimize for frequent movement */
                will-change: transform, left, top, z-index;
                /* Force hardware acceleration */
                /* transform: translate(-50%, -50%) translateZ(0); */
                /* Alternative: use backface-visibility to force compositing */
                backface-visibility: hidden;
            }
        `
    ];

    override render() {
        // using a particle table directly will only work for particles with this exact archetype
        // a query would find all particle tables including those with additional components
        const particles = this.service.database.archetypes.Particle;
        useEffect(() => {
            return this.service.database.observe.resources.renderFrame(() => {
                const position = particles.columns.position.get(this.particleIndex);
                const bottomRightCorner = VEC3.add(position, [0.5, -0.5, 0.5]);
                const [screenX, screenY, depth] = worldToScreen(
                    bottomRightCorner,
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
        return html`${this.particleIndex}`;
    }

}
