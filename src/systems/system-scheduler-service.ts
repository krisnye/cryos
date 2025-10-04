import { Observe } from "@adobe/data/observe";
import { Service } from "@adobe/data/service";
import { Frame } from "graphics/frame.js";
import { System } from "./system.js";

export interface SystemSchedulerService extends Service {
    frame: Observe<Frame>;
    setRunning: (running: boolean) => void;
    isRunning: Observe<boolean>;
    addSystems: (systems: System[]) => void;
}