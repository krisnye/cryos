import { Database } from "@adobe/data/ecs";
import { Vec2 } from "@adobe/data/math";
import { graphics } from "./graphics.js";

// Pointer types - only used internally by pointer-input plugin
type PointerId = number;

type PointerState = {
    initialPosition: Vec2;     // Position when pointer first touched
    currentPosition: Vec2;     // Current position (updated each frame)
    frameCount: number;        // Frames since pointer started
    frameDelta: Vec2;          // Movement since last frame
    totalDelta: Vec2;          // Total movement from initial position
    pressure: number;          // Touch pressure (0-1, mouse = 1)
    button: number;            // Which button (0=left, 1=right, 2=middle)
    modifiers: {               // Modifier keys at touch time
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
        meta: boolean;
    };
};

export const pointerInput = Database.Plugin.create({
    resources: {
        activePointers: { default: {} as Record<PointerId, PointerState>, transient: true },
    },
    systems: {
        pointerInput: {
            create: (db) => {
                const handlePointerDown = (event: PointerEvent) => {
                    const pointerId = event.pointerId;
                    
                    // Capture modifier states
                    const modifiers = {
                        ctrl: event.ctrlKey,
                        shift: event.shiftKey,
                        alt: event.altKey,
                        meta: event.metaKey
                    };
                    
                    // Get current position
                    const currentPosition: Vec2 = [event.clientX, event.clientY];
                    
                    // Create new pointer state
                    const currentActivePointers = { ...db.store.resources.activePointers };
                    currentActivePointers[pointerId] = {
                        initialPosition: currentPosition,
                        currentPosition: currentPosition,
                        frameCount: 0,
                        frameDelta: [0, 0],
                        totalDelta: [0, 0],
                        pressure: event.pressure,
                        button: event.button,
                        modifiers
                    };
                    db.store.resources.activePointers = currentActivePointers;

                    event.preventDefault();
                    event.stopPropagation();
                };

                const handlePointerMove = (event: PointerEvent) => {
                    const pointerId = event.pointerId;
                    const currentActivePointers = { ...db.store.resources.activePointers };
                    const pointerState = currentActivePointers[pointerId];

                    if (!pointerState) return;
                    
                    const newPosition: Vec2 = [event.clientX, event.clientY];
                    const frameDelta: Vec2 = [
                        newPosition[0] - pointerState.currentPosition[0],
                        newPosition[1] - pointerState.currentPosition[1]
                    ];
                    const totalDelta: Vec2 = [
                        newPosition[0] - pointerState.initialPosition[0],
                        newPosition[1] - pointerState.initialPosition[1]
                    ];
                    
                    // Update pointer state
                    currentActivePointers[pointerId] = {
                        ...pointerState,
                        currentPosition: newPosition,
                        frameDelta,
                        totalDelta,
                        pressure: event.pressure
                    };
                    db.store.resources.activePointers = currentActivePointers;

                    event.preventDefault();
                    event.stopPropagation();
                };

                const handlePointerUp = (event: PointerEvent) => {
                    const pointerId = event.pointerId;
                    
                    // Remove pointer from active pointers
                    const currentActivePointers = { ...db.store.resources.activePointers };
                    delete currentActivePointers[pointerId];
                    db.store.resources.activePointers = currentActivePointers;

                    event.preventDefault();
                    event.stopPropagation();
                };

                const handlePointerCancel = (event: PointerEvent) => {
                    const pointerId = event.pointerId;
                    
                    // Remove pointer from active pointers
                    const currentActivePointers = { ...db.store.resources.activePointers };
                    delete currentActivePointers[pointerId];
                    db.store.resources.activePointers = currentActivePointers;

                    event.preventDefault();
                    event.stopPropagation();
                };

                // Add event listeners
                document.addEventListener('pointerdown', handlePointerDown);
                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', handlePointerUp);
                document.addEventListener('pointercancel', handlePointerCancel);

                return () => {
                    // Increment frame count for all active pointers
                    const currentActivePointers = { ...db.store.resources.activePointers };
                    const updatedActivePointers: Record<PointerId, PointerState> = {};
                    
                    Object.entries(currentActivePointers).forEach(([id, pointerState]) => {
                        updatedActivePointers[Number(id)] = {
                            ...pointerState,
                            frameCount: pointerState.frameCount + 1
                        };
                    });
                    
                    db.store.resources.activePointers = updatedActivePointers;
                };
            },
            schedule: { during: ["input"] }
        }
    },
    extends: graphics
});

