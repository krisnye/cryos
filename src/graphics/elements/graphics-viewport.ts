import { ApplicationElement, useEffect, useElement, useObservable, useState, useResizeObserver, useDebounce, useMemo } from "@adobe/data/lit";
import { customElement, property } from "lit/decorators.js";
import { html, type TemplateResult } from "lit";
import { Entity } from "@adobe/data/ecs";
import { Camera } from "graphics/index.js";
import { GraphicsService } from "../graphics-service.js";
import { GraphicsDatabase } from "graphics/database/graphics-database.js";
import { Vec4 } from "@adobe/data/math";

export const tagName = "graphics-viewport";

declare global {
    interface HTMLElementTagNameMap {
        [tagName]: GraphicsViewport;
    }
}


// Hook to initialize viewport once
function useViewportInitialization(
    viewportId: Entity | null,
    device: GPUDevice | null | undefined,
    canvas: HTMLCanvasElement | null,
    actualWidth: number,
    actualHeight: number,
    database: GraphicsDatabase,
    clearColor: Vec4,
    initialCamera: Partial<Camera>,
    setViewportId: (id: Entity) => void
) {
        useEffect(() => {
            if (viewportId === null && device && canvas && actualWidth > 0 && actualHeight > 0) {
                canvas.width = actualWidth;
                canvas.height = actualHeight;
                initViewport(database, device, canvas, clearColor, initialCamera)
                    .then(viewportId => {
                        if (viewportId !== undefined) {
                            setViewportId(viewportId);
                        }
                    });
            }
        }, [device, canvas, actualWidth, actualHeight]);
}

// Hook to update viewport size when dimensions change
function useViewportSizeUpdate(
    viewportId: Entity | null,
    device: GPUDevice | null | undefined,
    canvas: HTMLCanvasElement | null,
    actualWidth: number,
    actualHeight: number,
    database: GraphicsDatabase
) {
    useEffect(() => {
        if (viewportId !== null && device && canvas && actualWidth > 0 && actualHeight > 0) {
            updateViewportSize(database, device, viewportId, canvas, actualWidth, actualHeight);
        }
    }, [actualWidth, actualHeight]);
}

@customElement(tagName)
export class GraphicsViewport extends ApplicationElement<GraphicsService> {

    @property({ type: Object })
    initialCamera: Partial<Camera> = {};

    @property({ type: Array })
    clearColor: Vec4 = [0.3, 0.3, 0.3, 1.0];

    @property({ type: Number })
    width: number = 800;

    @property({ type: Number })
    height: number = 600;

    @property({ type: Boolean })
    autoResize: boolean = true;

    @property({ type: Number })
    viewportId: Entity | null = null;

    override render(): TemplateResult {
        const device = useObservable(this.service.database.observe.resources.device);
        const canvas = useElement("canvas");
        const [size, setSize] = useState({ width: this.width, height: this.height });

        // Observe element size changes (memoized to prevent infinite loops)
        const handleResize = useMemo(() => (info: { width: number; height: number }) => {
            if (!this.autoResize) return;
            const width = Math.floor(info.width);
            const height = Math.floor(info.height);
            if (width > 0 && height > 0) {
                setSize({ width, height });
            }
        }, [this.autoResize]);
        
        useResizeObserver(handleResize);

        // Debounce GPU updates (150ms after resize stops)
        const debouncedSize = useDebounce(size, 150);

        // Use auto-size or explicit props
        const actualWidth = this.autoResize ? debouncedSize.width : this.width;
        const actualHeight = this.autoResize ? debouncedSize.height : this.height;

        // Initialize viewport once, then update on size changes
        useViewportInitialization(
            this.viewportId,
            device,
            canvas,
            actualWidth,
            actualHeight,
            this.service.database,
            this.clearColor,
            this.initialCamera,
            (id) => this.viewportId = id
        );
        useViewportSizeUpdate(
            this.viewportId,
            device,
            canvas,
            actualWidth,
            actualHeight,
            this.service.database
        );

        return html`
            <canvas style="display: block; width: 100%; height: 100%;"></canvas>
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

function updateViewportSize(database: GraphicsDatabase, device: GPUDevice, viewportId: Entity, canvas: HTMLCanvasElement, width: number, height: number) {
    // Update canvas dimensions and GPU resources together to keep them in sync
    canvas.width = width;
    canvas.height = height;
    
    // Create new depth texture with updated size
    const depthTexture = device.createTexture({
        size: [width, height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    // Update camera aspect ratio and depth texture
    database.transactions.updateViewportSize({
        viewportId,
        width,
        height,
        depthTexture,
    });
}