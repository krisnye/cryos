import { SystemPhase } from "./system-phase.js";

export type System = {
    readonly phase: SystemPhase;
    readonly run: (() => void) | (() => Promise<void>);
};
