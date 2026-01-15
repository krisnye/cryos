import { Database } from "@adobe/data/ecs";
import { KeyCode } from "../types/key-code.js";
import { KeyState } from "../types/key-state.js";
import { graphics } from "./graphics.js";

export const keyInput = Database.Plugin.create({
    extends: graphics,
    resources: {
        pressedKeys: { default: {} as Partial<Record<KeyCode, KeyState>>, transient: true },
    },
    systems: {
        keyInput: {
            create: (db) => {
                const handleKeyDown = (event: KeyboardEvent) => {
                    const keyCode = event.code as KeyCode;
                    
                    // Capture modifier states
                    const modifiers = {
                        ctrl: event.ctrlKey,
                        shift: event.shiftKey,
                        alt: event.altKey,
                        meta: event.metaKey
                    };

                    // Get current pressed keys and create new object
                    const currentPressedKeys = { ...db.store.resources.pressedKeys };
                    const existingState = currentPressedKeys[keyCode];

                    if (existingState) {
                        // Key already pressed - increment repeat count
                        currentPressedKeys[keyCode] = {
                            ...existingState,
                            repeatCount: existingState.repeatCount + 1
                        };
                    } else {
                        // New key press
                        currentPressedKeys[keyCode] = { 
                            repeatCount: 1, 
                            executeCount: 0,
                            frameCount: 0,
                            modifiers
                        };
                    }

                    // Assign back the updated object
                    db.store.resources.pressedKeys = currentPressedKeys;

                    event.preventDefault();
                    event.stopPropagation();
                };

                const handleKeyUp = (event: KeyboardEvent) => {
                    const keyCode = event.code as KeyCode;
                    
                    // Get current pressed keys and create new object
                    const currentPressedKeys = { ...db.store.resources.pressedKeys };
                    
                    // If meta key is released, remove all keys that were pressed with meta modifier
                    if (keyCode.startsWith('Meta')) {
                        Object.keys(currentPressedKeys).forEach(pressedKey => {
                            const keyState = currentPressedKeys[pressedKey as KeyCode];
                            if (keyState?.modifiers.meta) {
                                delete currentPressedKeys[pressedKey as KeyCode];
                            }
                        });
                    } else {
                        // Remove key directly
                        delete currentPressedKeys[keyCode];
                    }

                    // Assign back the updated object
                    db.store.resources.pressedKeys = currentPressedKeys;

                    event.preventDefault();
                    event.stopPropagation();
                };

                // Add event listeners
                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('keyup', handleKeyUp);

                return () => {
                    // Increment frame count for all pressed keys
                    const currentPressedKeys = { ...db.store.resources.pressedKeys };
                    const updatedPressedKeys: Partial<Record<KeyCode, KeyState>> = {};
                    
                    Object.entries(currentPressedKeys).forEach(([key, keyState]) => {
                        if (keyState) {
                            updatedPressedKeys[key as KeyCode] = {
                                ...keyState,
                                frameCount: keyState.frameCount + 1
                            };
                        }
                    });
                    
                    db.store.resources.pressedKeys = updatedPressedKeys;
                };
            },
            schedule: { during: ["input"] }
        }
    },
});

