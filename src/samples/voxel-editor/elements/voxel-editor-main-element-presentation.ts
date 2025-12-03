import { html, TemplateResult } from "lit";
import { Vec3, Vec2 } from "@adobe/data/math";
import { Entity } from "@adobe/data/ecs";
import { GraphicsViewport } from "../../../graphics/elements/graphics-viewport.js";
import { schema } from "../voxel-editor-store.js";
import "./voxel-editor-material-palette.js";

// Helper type for viewport event data
interface ViewportEventData {
    viewportPosition: Vec2;
    viewportId: Entity;
    pointerId: number;
}

// Helper function to extract viewport event data
const getViewportEventData = (e: PointerEvent): ViewportEventData | null => {
    const viewport = e.target as GraphicsViewport;
    if (!viewport?.viewportId) {
        return null;
    }
    const bounds = viewport.getBoundingClientRect();
    return {
        viewportPosition: [e.clientX - bounds.left, e.clientY - bounds.top],
        viewportId: viewport.viewportId,
        pointerId: e.pointerId
    };
};

type RenderArgs = {
    keyPress: (e: KeyboardEvent) => void;
    pointerDown: (data: ViewportEventData) => void;
    pointerUp: (data: ViewportEventData) => void;
    pointerMove: (data: ViewportEventData) => void;
}

export const render = (props: RenderArgs): TemplateResult => {
    const center = Vec3.scale(schema.resources.modelSize.default, 0.5);
    return html`
        <div class="game-container" tabindex="0" @keydown=${props.keyPress} style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        ">
            <graphics-viewport
                style="display: block; width: 100%; height: 100%; pointer-events: auto;"
                .initialCamera=${{
                    position: Vec3.add([23, 23, 23], center),
                    target: center
                }}
                .clearColor=${[0.0, 0.0, 0.0, 0.0] as const}
                @pointerdown=${(e: PointerEvent) => {
                    const data = getViewportEventData(e);
                    if (data) {
                        props.pointerDown(data);
                    }
                }}
                @pointerup=${(e: PointerEvent) => {
                    const data = getViewportEventData(e);
                    if (data) {
                        props.pointerUp(data);
                    }
                }}
                @pointermove=${(e: PointerEvent) => {
                    const data = getViewportEventData(e);
                    if (data) {
                        props.pointerMove(data);
                    }
                }}
            >
            </graphics-viewport>
            <voxel-editor-toolbar style="pointer-events: none;"></voxel-editor-toolbar>
            <voxel-editor-material-palette style="pointer-events: none;"></voxel-editor-material-palette>
        </div>
    `;
};

