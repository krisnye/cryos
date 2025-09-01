import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { KeyCode } from "../../types/key-code.js";
import { KeyState } from "../voxel-store.js";

export const keyInputSystem = ({ store, database }: MainService): System => {

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
        
        // Remove key directly
        delete store.resources.pressedKeys[keyCode];

        event.preventDefault();
        event.stopPropagation();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return {
        name: "keyInputSystem",
        phase: "input",
        run: () => {
            // Increment frame count for all pressed keys
            Object.values(store.resources.pressedKeys).forEach(keyState => {
                keyState.frameCount += 1;
            });
        }
    };
}; 