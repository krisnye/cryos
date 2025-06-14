import { toposort } from "data/functions/toposort";
import { System, SystemPhases } from "./system";

interface SystemScheduler<P extends SystemPhases> {
    run: (runPhases?: readonly P[number][]) => void;
} 

export function createSystemScheduler<P extends SystemPhases>(phases: P, systems: System<P>[]) {
    const systemMap = new Map<P[number], System<P>[]>();
    for (const system of systems) {
        let phaseSystems = systemMap.get(system.phase);
        if (!phaseSystems) {
            systemMap.set(system.phase, phaseSystems = []);
        }
        phaseSystems.push(system);
    }
    // now topologically sort each phase
    for (const phase of phases) {
        const phaseSystems = systemMap.get(phase);
        if (!phaseSystems) {
            continue;
        }
        const edges: [string, string][] = [];
        for (const system of phaseSystems) {
            if (system.before) {
                for (const before of system.before) {
                    edges.push([system.name, before]);
                }
            }
            if (system.after) {
                for (const after of system.after) {
                    edges.push([after, system.name]);
                }
            }
        }
        const sortedSystems = toposort(new Set(phaseSystems.map(s => s.name)), edges);
        systemMap.set(phase, sortedSystems.map(name => phaseSystems.find(s => s.name === name)!));
    }

    const scheduler: SystemScheduler<P> = {
        run: async (runPhases = phases) => {
            for (const phase of runPhases) {
                const phaseSystems = systemMap.get(phase);
                if (!phaseSystems) {
                    continue;
                }
                for (const system of phaseSystems) {
                    const result = system.run();
                    if (result) {
                        await result;
                    }
                }
            }
        }
    }
    return scheduler;
}