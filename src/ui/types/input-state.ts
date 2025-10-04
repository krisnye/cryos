import { KeyCode } from "./key-code.js";

export type KeyState = {
    repeatCount: number;
    executeCount: number;
    frameCount: number;
    modifiers: {
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
        meta: boolean;
    };
};

export type InputState = {
    pressedKeys: Partial<Record<KeyCode, KeyState>>;
};
