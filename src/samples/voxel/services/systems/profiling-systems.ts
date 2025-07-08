import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";

interface ProfilingData {
    frameStartTime: number;
    frameEndTime: number;
    frameDuration: number;
    renderStartTime: number;
    renderEndTime: number;
    renderDuration: number;
    frameCount: number;
}

export const profilingSystems = (main: MainService): System[] => {
    // Profiling data state
    let profilingData: ProfilingData = {
        frameStartTime: 0,
        frameEndTime: 0,
        frameDuration: 0,
        renderStartTime: 0,
        renderEndTime: 0,
        renderDuration: 0,
        frameCount: 0,
    };

    return [{
        name: "profilingSystems-input",
        phase: "input",
        run: () => {
            // Start CPU timing for the entire frame
            profilingData.frameStartTime = performance.now();
        }
    }, {
        name: "profilingSystems-preRender",
        phase: "preRender",
        run: () => {
            // Start CPU timing for the render phase
            profilingData.renderStartTime = performance.now();
        }
    }, {
        name: "profilingSystems-postRender",
        phase: "postRender",
        run: () => {
            // End CPU timing for the render phase
            profilingData.renderEndTime = performance.now();
            profilingData.renderDuration = profilingData.renderEndTime - profilingData.renderStartTime;
        }
    }, {
        name: "profilingSystems-cleanup",
        phase: "cleanup",
        run: () => {
            // End CPU timing for the entire frame
            profilingData.frameEndTime = performance.now();
            profilingData.frameDuration = profilingData.frameEndTime - profilingData.frameStartTime;
            profilingData.frameCount++;

            // Calculate CPU update time (frame time minus render time)
            const updateDuration = profilingData.frameDuration - profilingData.renderDuration;

            // Log profiling data every 60 frames (approximately once per second at 60fps)
            if (profilingData.frameCount % 60 === 0) {
                // console.log(`Frame ${profilingData.frameCount}:`);
                // console.log(`  CPU Frame Time: ${profilingData.frameDuration.toFixed(2)}ms`);
                // console.log(`  CPU Render Time: ${profilingData.renderDuration.toFixed(2)}ms`);
                // console.log(`  CPU Update Time: ${updateDuration.toFixed(2)}ms`);
                // console.log(`  FPS: ${(1000 / profilingData.frameDuration).toFixed(1)}`);
            }
        }
    }]
};
