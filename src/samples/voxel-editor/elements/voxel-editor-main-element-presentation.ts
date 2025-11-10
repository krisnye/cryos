import { html, TemplateResult } from "lit";
import { Vec3, Vec2 } from "@adobe/data/math";
import { Entity } from "@adobe/data/ecs";
import { GraphicsViewport } from "../../../graphics/elements/graphics-viewport.js";

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

export interface VoxelEditorMainElementProps {
    modelSize: Vec3;
    clearColor: readonly [number, number, number, number];
    keyPress: (e: KeyboardEvent) => void;
    pointerDown: (data: ViewportEventData) => void;
    pointerUp: (data: ViewportEventData) => void;
    pointerMove: (data: ViewportEventData) => void;
}

export const render = (props: VoxelEditorMainElementProps): TemplateResult => {
    const center = Vec3.scale(props.modelSize, 0.5);
    return html`
        <div class="game-container" tabindex="0" @keydown=${props.keyPress}>
            <graphics-viewport
                style="border: 1px solid red;"
                .initialCamera=${{
                    position: Vec3.add([15, 15, 15], center),
                    target: center
                }}
                .clearColor=${props.clearColor}
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
        </div>
    `;
};

