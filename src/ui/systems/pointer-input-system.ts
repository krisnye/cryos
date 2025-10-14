import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { Vec2 } from "@adobe/data/math";

export const pointerInputSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;

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
        store.resources.activePointers[pointerId] = {
            initialPosition: currentPosition,
            currentPosition: currentPosition,
            frameCount: 0,
            frameDelta: [0, 0],
            totalDelta: [0, 0],
            pressure: event.pressure,
            button: event.button,
            modifiers
        };

        event.preventDefault();
        event.stopPropagation();
    };

    const handlePointerMove = (event: PointerEvent) => {
        const pointerId = event.pointerId;
        const pointerState = store.resources.activePointers[pointerId];

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
        pointerState.currentPosition = newPosition;
        pointerState.frameDelta = frameDelta;
        pointerState.totalDelta = totalDelta;
        pointerState.pressure = event.pressure;

        event.preventDefault();
        event.stopPropagation();
    };

    const handlePointerUp = (event: PointerEvent) => {
        const pointerId = event.pointerId;
        
        // Remove pointer from active pointers
        delete store.resources.activePointers[pointerId];

        event.preventDefault();
        event.stopPropagation();
    };

    const handlePointerCancel = (event: PointerEvent) => {
        const pointerId = event.pointerId;
        
        // Remove pointer from active pointers
        delete store.resources.activePointers[pointerId];

        event.preventDefault();
        event.stopPropagation();
    };

    // Add event listeners
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

    return [{
        name: "pointerInputSystem",
        phase: "input",
        run: () => {
            // Increment frame count for all active pointers
            Object.values(store.resources.activePointers).forEach(pointerState => {
                pointerState.frameCount += 1;
            });
        },
        dispose: () => {
            // Remove event listeners
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerCancel);
        }
    }];
};
