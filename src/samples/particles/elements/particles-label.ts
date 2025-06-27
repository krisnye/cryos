import { customElement, property } from "lit/decorators.js";
import { css, html } from "lit";
import { ParticlesElement } from "../particles-element.js";
import { worldToScreen, getWorldPositionDepth } from "graphics/camera/world-to-screen.js";
import { useEffect } from "@adobe/data/lit";

@customElement("particles-label")
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
                border-radius: 3px;
                font-size: 12px;
                font-family: monospace;
                transform: translate(-50%, -50%);
                /* Optimize for frequent movement */
                will-change: transform, left, top, z-index;
                /* Force hardware acceleration */
                transform: translate(-50%, -50%) translateZ(0);
                /* Alternative: use backface-visibility to force compositing */
                backface-visibility: hidden;
            }
        `
    ];

    override render() {
        const particles = this.service.store.ensureArchetype(["id", "particle", "velocity"]);
        useEffect(() => {
            return this.service.database.observe.resource.renderFrame(() => {
                const particle = particles.columns.particle.get(this.particleIndex);
                const screenPos = worldToScreen(
                    particle.position, 
                    this.service.store.resources.camera, 
                    this.service.store.resources.graphics.canvas.width,
                    this.service.store.resources.graphics.canvas.height
                );
                
                // Calculate depth for z-index layering
                const depth = getWorldPositionDepth(particle.position, this.service.store.resources.camera);
                const zIndex = Math.floor(depth * 10000); // Scale depth to z-index range
                
                this.style.left = `${screenPos[0]}px`;
                this.style.top = `${screenPos[1]}px`;
                this.style.zIndex = `${zIndex}`;
            })
        })
        return html`${this.particleIndex}`;
    }

}
