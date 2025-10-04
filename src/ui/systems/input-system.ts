import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { KeyCode } from "../types/key-code.js";

export const inputSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;

    const handleKeyDown = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        
        // Capture modifier states
        const modifiers = {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey,
            meta: event.metaKey
        };
        
        // Handle key press directly
        const existingState = store.resources.pressedKeys[keyCode];
        
        if (existingState) {
            // Key already pressed - increment repeat count
            existingState.repeatCount += 1;
        } else {
            // New key press
            store.resources.pressedKeys[keyCode] = { 
                repeatCount: 1, 
                executeCount: 0,
                frameCount: 0,
                modifiers
            };
        }

        event.preventDefault();
        event.stopPropagation();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        
        // If meta key is released, remove all keys that were pressed with meta modifier
        if (keyCode.startsWith('Meta')) {
            Object.keys(store.resources.pressedKeys).forEach(pressedKey => {
                const keyState = store.resources.pressedKeys[pressedKey as KeyCode];
                if (keyState?.modifiers.meta) {
                    delete store.resources.pressedKeys[pressedKey as KeyCode];
                }
            });
        } else {
            // Remove key directly
            delete store.resources.pressedKeys[keyCode];
        }

        event.preventDefault();
        event.stopPropagation();
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return [{
        name: "inputSystem",
        phase: "input",
        run: () => {
            // Increment frame count for all pressed keys
            Object.values(store.resources.pressedKeys).forEach(keyState => {
                keyState.frameCount += 1;
            });
            // console.log(JSON.stringify(store.resources.pressedKeys, null, 2));
        },
        dispose: () => {
            // Remove event listeners
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        }
    }];
};
