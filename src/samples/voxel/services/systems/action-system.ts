import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { KeyCode } from "../../types/key-code.js";
import { CameraMovement } from "../transactions/move-camera.js";

export const actionSystem = ({ store, database }: MainService): System => {
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
        const maxFrames = Math.max(...movementKeys.map(key => pressedKeys[key]?.frames ?? 0));
        
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
        "KeyR": () => rotateCamera('pitch', 2),    // Pitch up
        "KeyF": () => rotateCamera('pitch', -2),   // Pitch down
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
    const immediateHandlers: Partial<Record<KeyCode, () => void>> = {
        "Escape": () => database.transactions.clearSelection()
    };
    
    return {
        name: "actionSystem",
        phase: "input", // Runs after keyInputSystem
        run: () => {
            const { pressedKeys } = store.resources;
            
            // Execute actions for each pressed key
            Object.entries(pressedKeys).forEach(([keyCode, keyState]) => {
                const key = keyCode as KeyCode;
                
                // Execute immediate actions only on first press
                if (keyState.repeat === 0) {
                    const immediateHandler = immediateHandlers[key];
                    if (immediateHandler) immediateHandler();
                }
                
                // Execute frame-based actions
                const frameHandler = frameHandlers[key];
                if (frameHandler) frameHandler();
                
                // Execute repeat-based actions if new repeat occurred
                if (keyState.repeat > keyState.lastRepeatCount) {
                    const repeatHandler = repeatHandlers[key];
                    if (repeatHandler) repeatHandler();
                }
            });
        }
    };
}; 