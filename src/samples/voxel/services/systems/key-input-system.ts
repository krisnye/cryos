import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { KeyCode } from "../../types/key-code.js";

export const keyInputSystem = ({ store, database }: MainService): System => {

    // database.observe.resources.pressedKeys(values => {
    //     if (Object.entries(values).length > 0) {
    //         console.log(JSON.stringify(values));
    //     }
    // });

    const handleKeyDown = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        database.transactions.pressKey(keyCode);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const keyCode = event.code as KeyCode;
        database.transactions.releaseKey(keyCode);
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