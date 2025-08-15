import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { KeyCode } from "../../types/key-code.js";

export const keyInputSystem = ({ store, database }: MainService): System => {

    const handleKeyDown = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        
        // Only register the key if it's not already pressed
        if (database.resources.pressedKeys[keyCode] === undefined) {
            database.transactions.pressKey(keyCode);
        }

        event.preventDefault();
        event.stopPropagation();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        database.transactions.releaseKey(keyCode);

        event.preventDefault();
        event.stopPropagation();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return {
        name: "keyInputSystem",
        phase: "input",
        run: () => {
            // Increment pressed keys by 1 each frame
            database.transactions.incrementPressedKeys();
        }
    };
}; 