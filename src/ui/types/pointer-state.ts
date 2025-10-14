import { Vec2 } from "@adobe/data/math";

export type PointerId = number;

export type PointerState = {
    initialPosition: Vec2;     // Position when pointer first touched
    currentPosition: Vec2;     // Current position (updated each frame)
    frameCount: number;        // Frames since pointer started
    frameDelta: Vec2;          // Movement since last frame
    totalDelta: Vec2;          // Total movement from initial position
    pressure: number;          // Touch pressure (0-1, mouse = 1)
    button: number;            // Which button (0=left, 1=right, 2=middle)
    modifiers: {               // Modifier keys at touch time
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
        meta: boolean;
    };
};

export type PointerInputState = {
    activePointers: Record<PointerId, PointerState>;
};
