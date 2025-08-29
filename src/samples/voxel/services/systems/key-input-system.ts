import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { KeyCode } from "../../types/key-code.js";

export const keyInputSystem = ({ store, database }: MainService): System => {

    const handleKeyDown = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        
        if (event.repeat) {
            // This is a repeat event - increment repeat count
            database.transactions.incrementRepeat(keyCode);
        } else {
            // This is a new press - only register if not already pressed
            if (database.resources.pressedKeys[keyCode] === undefined) {
                database.transactions.pressKey(keyCode);
            }
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
            // Increment frame counters and update lastRepeatCount
            database.transactions.incrementPressedKeys();
        }
    };
}; 