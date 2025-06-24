import { SystemPhase } from "./system-phase.js";

export type System = {
    readonly phase: SystemPhase;
    readonly run: (() => void) | (() => Promise<void>);
    readonly before?: readonly string[];
    readonly after?: readonly string[];
};
