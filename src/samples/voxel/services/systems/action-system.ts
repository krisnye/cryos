import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { KeyCode, KeyCombination, ModifierKey } from "../../types/key-code.js";
import { CameraMovement } from "../transactions/move-camera.js";
import { KeyState } from "../voxel-store.js";

// Utility function to parse a key combination string
const parseKeyCombination = (combination: KeyCombination): { modifiers: ModifierKey[]; key: KeyCode } => {
    const parts = combination.split('+');
    if (parts.length === 1) {
        return { modifiers: [], key: parts[0] as KeyCode };
    }
    const modifiers = parts.slice(0, -1) as ModifierKey[];
    const key = parts[parts.length - 1] as KeyCode;
    return { modifiers, key };
};

// Utility function to check if a key state matches a combination
const matchesKeyCombination = (
    keyCode: KeyCode, 
    keyState: KeyState, 
    combination: KeyCombination
): boolean => {
    const { modifiers, key } = parseKeyCombination(combination);
    
    // Check if the main key matches
    if (keyCode !== key) return false;
    
    // Check if all required modifiers are active
    return modifiers.every(mod => {
        switch (mod) {
            case "Ctrl": return keyState.modifiers.ctrl;
            case "Shift": return keyState.modifiers.shift;
            case "Alt": return keyState.modifiers.alt;
            case "Meta": return keyState.modifiers.meta;
        }
    });
};

export const actionSystem = ({ store, database, undoRedo }: MainService): System => {
    // Higher-order functions for camera operations
    const moveCamera = (movementParams: CameraMovement) => {
        const { pressedKeys, updateFrame } = store.resources;
        const { deltaTime } = updateFrame;
        
        // Calculate acceleration based on how long any movement key has been held
        const baseSpeed = 10;
        const maximumSpeed = 1500;
        const accelerationPerFrame = 0.2;
        
        // Find the maximum frame count from any movement key to calculate acceleration
        const movementKeys = ["KeyW", "KeyS", "KeyA", "KeyD", "ArrowUp", "ArrowDown"];
        const maxFrames = Math.max(...movementKeys.map(key => (pressedKeys as Partial<Record<KeyCode, KeyState>>)[key as KeyCode]?.frameCount ?? 0));
        
        const acceleration = Math.min(1 + maxFrames * accelerationPerFrame, maximumSpeed / baseSpeed);
        const movementAmount = baseSpeed * acceleration * deltaTime;
        
        // Scale the movement values by acceleration
        const scaledMovement: CameraMovement = {};
        if (movementParams.forward) scaledMovement.forward = movementParams.forward * movementAmount;
        if (movementParams.right) scaledMovement.right = movementParams.right * movementAmount;
        if (movementParams.up) scaledMovement.up = movementParams.up * movementAmount;
        
        database.transactions.moveCamera(scaledMovement);
    };
    
    const rotateCamera = (axis: 'pitch' | 'yaw' | 'roll', rate: number) => {
        const { updateFrame } = store.resources;
        const amount = rate * updateFrame.deltaTime;
        
        const movement: CameraMovement = { [axis]: amount };
        database.transactions.moveCamera(movement);
    };
    
    // Frame-based handlers (execute every frame while key is held)
    const frameHandlers: Partial<Record<KeyCode, () => void>> = {
        // WASD movement
        "KeyW": () => moveCamera({ up: 1 }),      // Up
        "KeyS": () => moveCamera({ up: -1 }),     // Down
        "KeyA": () => moveCamera({ right: -1 }),  // Left
        "KeyD": () => moveCamera({ right: 1 }),   // Right
        
        // Arrow key movement
        "ArrowUp": () => moveCamera({ forward: 1 }),   // Forward
        "ArrowDown": () => moveCamera({ forward: -1 }), // Backward
        
        // Camera rotation
        "KeyF": () => rotateCamera('pitch', 2),    // Pitch up
        "KeyR": () => rotateCamera('pitch', -2),   // Pitch down
        "ArrowLeft": () => rotateCamera('yaw', 2), // Yaw left
        "ArrowRight": () => rotateCamera('yaw', -2), // Yaw right
        "KeyQ": () => rotateCamera('roll', -2),    // Roll left
        "KeyE": () => rotateCamera('roll', 2)      // Roll right
    };
    
    // Repeat-based handlers (execute on each repeat event)
    const repeatHandlers: Partial<Record<KeyCode, () => void>> = {
        // Could add repeat-based actions here
        // "Space": () => database.transactions.placeVoxel()
    };
    
    // Immediate handlers (execute once when key is first pressed)
    const immediateHandlers: Partial<Record<KeyCombination, () => void>> = {
        "Escape": () => database.transactions.clearSelection(),
        "Ctrl+KeyZ": () => undoRedo.undo(),
        "Meta+KeyZ": () => { console.log("Meta+KeyZ"); undoRedo.undo() },
        "Ctrl+Shift+KeyY": () => undoRedo.redo(),
        "Meta+Shift+KeyY": () => undoRedo.redo(),
        "Meta+KeyP": () => console.log("meta + P pressed"),
    };
    
    return {
        name: "actionSystem",
        phase: "input", // Runs after keyInputSystem
        run: () => {
            const { pressedKeys } = store.resources;
            
            // Execute actions for each pressed key
            Object.entries(pressedKeys).forEach(([keyCode, keyState]) => {
                const key = keyCode as KeyCode;
                const state = keyState as KeyState;
                
                // Execute immediate actions only when executeCount < repeatCount
                if (state.executeCount < state.repeatCount) {
                    // Check for key combinations in immediate handlers
                    for (const [combination, handler] of Object.entries(immediateHandlers)) {
                        if (matchesKeyCombination(key, state, combination as KeyCombination)) {
                            handler();
                            // Mark as executed directly
                            state.executeCount += 1;
                            break; // Only execute the first matching handler
                        }
                    }
                }
                
                // Execute frame-based actions
                const frameHandler = frameHandlers[key];
                if (frameHandler) frameHandler();
                
                // Execute repeat-based actions if repeat count increased
                // Note: This will fire on every repeat event since we're not tracking lastRepeatCount
                // If you need to limit this, you could add a flag or use a different approach
                const repeatHandler = repeatHandlers[key];
                if (repeatHandler && state.repeatCount > 1) {
                    repeatHandler();
                }
            });
        }
    };
}; 