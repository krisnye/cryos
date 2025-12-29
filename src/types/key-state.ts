
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

