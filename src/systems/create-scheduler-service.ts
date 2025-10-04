import { createObservableState } from "@adobe/data/observe";
import { SystemSchedulerService } from "./system-scheduler-service.js";
import { System } from "./system.js";
import { SystemPhase } from "./system-phase.js";
import { GraphicsStore } from "graphics/database/graphics-store.js";

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

export function createSystemSchedulerService<T extends GraphicsStore>(store: T): SystemSchedulerService {
    let frame = { count: 0, deltaTime: 1 / 60 };
    let isRunning = false;
    const [frameObserve, setFrame] = createObservableState(frame);
    const [isRunningObserve, setIsRunning] = createObservableState(false);

    let requestAnimationFrameId: number | null = null;
    const requestNextFrame = () => {
        if (!requestAnimationFrameId) {
            requestAnimationFrameId = requestAnimationFrame(runFrame);
        }
    }
    isRunningObserve(value => {
        isRunning = value;
        if (value) {
            requestNextFrame();
        } else if (requestAnimationFrameId) {
            cancelAnimationFrame(requestAnimationFrameId);
            requestAnimationFrameId = null;
        }
    })

    // convert systems to a Map of phase -> systems
    let systemsByPhase = new Map<SystemPhase, System[]>();

    const runPhase = async (phase: SystemPhase) => {
        const systems = systemsByPhase.get(phase);
        if (systems && systems.length > 0) {
            await Promise.all(systems.map((system) => system.run()));
        }
    }

    const runFrame = async () => {
        requestAnimationFrameId = null;
        setFrame(frame = { count: frame.count + 1, deltaTime: 1 / 60 });

        //  input
        await runPhase("input");

        //  update
        const { device } = store.resources;
        if (device) {
            const commandEncoder = store.resources.commandEncoder = device.createCommandEncoder();
            await runPhase("update");
    
            //  physics
            await runPhase("physics");
    
            //  render
            for (const viewportTable of store.queryArchetypes(store.archetypes.Viewport.components)) {
                for (let i = 0; i < viewportTable.rowCount; i++) {
                    const viewportId = viewportTable.columns.id.get(i);
                    const context = viewportTable.columns.context.get(i);
                    const depthTexture = viewportTable.columns.depthTexture.get(i);
                    const color = viewportTable.columns.color.get(i);
                    const renderPassEncoder = commandEncoder.beginRenderPass({
                        colorAttachments: [{
                            clearValue: color,
                            loadOp: 'clear',
                            storeOp: 'store',
                            view: context.getCurrentTexture().createView(),
                        }],
                        depthStencilAttachment: {
                            view: depthTexture.createView(),
                            depthClearValue: 1.0,
                            depthLoadOp: 'clear',
                            depthStoreOp: 'store',
                        }
                    });
                    store.resources.activeViewport = viewportId;
                    store.resources.renderPassEncoder = renderPassEncoder;

                    await runPhase("pre-render");
                    await runPhase("render");
                    await runPhase("post-render");

                    renderPassEncoder.end();
                }
            }

            device.queue.submit([commandEncoder.finish()]);
        }

        if (isRunning) {
            requestNextFrame();
        }
    }

    const addSystems = (systems: System[]) => {
        systemsByPhase = groupSystemsByPhase(systems);
    }

    return {
        serviceName: "system-service",
        frame: frameObserve,
        setRunning: (running: boolean) => setIsRunning(running),
        isRunning: isRunningObserve,
        addSystems,
    }
}