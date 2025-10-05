import { ApplicationElement, useEffect, useElement, useObservable, useState } from "@adobe/data/lit";
import { customElement, property } from "lit/decorators.js";
import { html, css, TemplateResult, CSSResult } from "lit";
import { Entity } from "@adobe/data/ecs";
import { Camera } from "graphics/camera/camera.js";
import { GraphicsService } from "../graphics-service.js";
import { GraphicsDatabase } from "graphics/database/graphics-database.js";
import { Vec4 } from "@adobe/data/math";

export const tagName = "graphics-viewport";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: GraphicsViewport;
    }
}

@customElement(tagName)
export class GraphicsViewport extends ApplicationElement<GraphicsService> {
    static override styles: CSSResult = css`
        :host {
            display: inline-block;
        }
        canvas {
            display: block;
        }
    `;

    @property({ type: Object })
    initialCamera: Partial<Camera> = {};

    @property({ type: Array })
    clearColor: Vec4 = [0.3, 0.3, 0.3, 1.0];

    @property({ type: Number })
    width: number = 800;

    @property({ type: Number })
    height: number = 600;

    override render(): TemplateResult {
        const device = useObservable(this.service.database.observe.resources.device);
        const canvas = useElement("canvas");
        const [viewportId, setViewportId] = useState<Entity | null>(null);
        useEffect(() => {
            if (device && canvas) {
                // Set canvas size
                canvas.width = this.width;
                canvas.height = this.height;
                initViewport(this.service.database, device, canvas, this.clearColor, this.initialCamera).then(setViewportId);
            }
        }, [device, canvas, this.width, this.height]);

        return html`
            <canvas @click=${() => console.log("click", viewportId)}></canvas>
        `;
    }
}

async function initViewport(database: GraphicsDatabase, device: GPUDevice, canvas: HTMLCanvasElement, color: Vec4, camera?: Partial<Camera>) {
    const context = canvas.getContext('webgpu');
    if (!context) {
        throw new Error('No WebGPU context');
    }

    context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
    });

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const viewportId = database.transactions.insertViewport({
        context,
        camera: {
            aspect: canvas.width / canvas.height,
            fieldOfView: Math.PI / 4,
            nearPlane: 0.1,
            farPlane: 100.0,
            position: [0, 0, 20],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
            ...camera,
        },
        depthTexture,
        color,
    });
    return viewportId;
}