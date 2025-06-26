import { SystemPhase } from "./system-phase.js";

export type System = {
    readonly name: string;
    readonly phase: SystemPhase;
    readonly run: (() => void) | (() => Promise<void>);
};
