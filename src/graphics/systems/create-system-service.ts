import { createObservableState } from "@adobe/data/observe";
import { SystemService } from "./system-service.js";
import { System } from "./system.js";
import { SystemPhase, SystemRenderPhaseSchema, SystemUpdatePhaseSchema } from "./system-phase.js";

function groupSystemsByPhase(systems: System[]): Map<SystemPhase, System[]> {
    const systemsByPhase = new Map<SystemPhase, System[]>();
    for (const system of systems) {
        const phase = system.phase;
        if (!systemsByPhase.has(phase)) {
            systemsByPhase.set(phase, []);
        }
        systemsByPhase.get(phase)?.push(system);
    }
    return systemsByPhase;
}

export function createSystemService(): SystemService {
    let updateFrame = { count: 0 };
    let renderFrame = { count: 0 };
    let isRunning = false;
    const [updateFrameObserve, setUpdateFrame] = createObservableState(updateFrame);
    const [renderFrameObserve, setRenderFrame] = createObservableState(renderFrame);
    const [isRunningObserve, setIsRunning] = createObservableState(false);

    let requestAnimationFrameId: number | null = null;
    isRunningObserve(value => {
        isRunning = value;
        if (value) {
            if (!requestAnimationFrameId) {
                requestAnimationFrameId = requestAnimationFrame(runFrame);
            }
        } else if (requestAnimationFrameId) {
            cancelAnimationFrame(requestAnimationFrameId);
            requestAnimationFrameId = null;
        }
    })

    // convert systems to a Map of phase -> systems
    let systemsByPhase = new Map<SystemPhase, System[]>();

    const runPhase = async (phase: SystemPhase) => {
        const systems = systemsByPhase.get(phase);
        if (systems) {
            await Promise.all(systems.map((system) => system.run()));
        }
    }

    const runFrame = async () => {
        setUpdateFrame(updateFrame = { count: updateFrame.count + 1 });
        for (const phase of SystemUpdatePhaseSchema.enum) {
            await runPhase(phase);
        }
        setRenderFrame(renderFrame = { count: renderFrame.count + 1 });
        for (const phase of SystemRenderPhaseSchema.enum) {
            await runPhase(phase);
        }
        console.log("runFrame");
        if (updateFrame.count >= 200) {
            setIsRunning(false);
        }
        if (isRunning) {
            requestAnimationFrame(runFrame);
        }
    }

    const addSystems = (systems: System[]) => {
        systemsByPhase = groupSystemsByPhase(systems);
    }

    return {
        serviceName: "system-service",
        updateFrame: updateFrameObserve,
        renderFrame: renderFrameObserve,
        setRunning: (running: boolean) => setIsRunning(running),
        isRunning: isRunningObserve,
        addSystems,
    }
}