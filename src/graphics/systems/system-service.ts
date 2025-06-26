import { Observe } from "@adobe/data/observe";
import { Service } from "@adobe/data/service";
import { Frame } from "graphics/frame.js";
import { System } from "./system.js";

export interface SystemService extends Service {

    updateFrame: Observe<Frame>;
    renderFrame: Observe<Frame>;
    setRunning: (running: boolean) => void;
    isRunning: Observe<boolean>;
    addSystems: (systems: System[]) => void;

}