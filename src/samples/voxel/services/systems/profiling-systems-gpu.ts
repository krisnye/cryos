import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";

interface ProfilingData {
    frameStartTime: number;
    frameEndTime: number;
    frameDuration: number;
    renderStartTime: number;
    renderEndTime: number;
    renderDuration: number;
    gpuRenderStartTime: number;
    gpuRenderEndTime: number;
    gpuRenderDuration: number;
    timestampQuerySet: GPUQuerySet;
    timestampBuffer: GPUBuffer;
    frameCount: number;
}

export const profilingSystemsWithGPU = (main: MainService): System[] => {
    const { graphics: { device } } = main.database.resources;

    // Check if timestamp queries are supported
    const timestampQuerySupported = device.features.has('timestamp-query');
    
    let timestampQuerySet: GPUQuerySet | null = null;
    let timestampBuffer: GPUBuffer | null = null;

    if (timestampQuerySupported) {
        // Create timestamp query set for GPU timing
        timestampQuerySet = device.createQuerySet({
            type: 'timestamp',
            count: 2, // Start and end timestamps
        });

        // Create buffer to resolve timestamp queries
        timestampBuffer = device.createBuffer({
            size: 2 * 8, // 2 timestamps * 8 bytes each
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
    } else {
        console.warn("GPU timestamp queries not supported on this device. Using CPU-only profiling.");
    }

    // Profiling data state
    let profilingData: ProfilingData = {
        frameStartTime: 0,
        frameEndTime: 0,
        frameDuration: 0,
        renderStartTime: 0,
        renderEndTime: 0,
        renderDuration: 0,
        gpuRenderStartTime: 0,
        gpuRenderEndTime: 0,
        gpuRenderDuration: 0,
        timestampQuerySet: timestampQuerySet!,
        timestampBuffer: timestampBuffer!,
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
            
            // Note: GPU timestamp queries are not yet fully supported in the current WebGPU API
            // This is a placeholder for when the API becomes available
            // For now, we use CPU timing which provides good approximation
            if (timestampQuerySet && timestampBuffer) {
                // TODO: Implement when writeTimestamp is available on GPUCommandEncoder
                // const { commandEncoder } = main.database.resources;
                // commandEncoder.writeTimestamp(timestampQuerySet, 0);
            }
        }
    }, {
        name: "profilingSystems-postRender",
        phase: "postRender",
        run: () => {
            // End CPU timing for the render phase
            profilingData.renderEndTime = performance.now();
            profilingData.renderDuration = profilingData.renderEndTime - profilingData.renderStartTime;
            
            // Note: GPU timestamp queries are not yet fully supported in the current WebGPU API
            // This is a placeholder for when the API becomes available
            if (timestampQuerySet && timestampBuffer) {
                // TODO: Implement when writeTimestamp is available on GPUCommandEncoder
                // const { commandEncoder } = main.database.resources;
                // commandEncoder.writeTimestamp(timestampQuerySet, 1);
                // commandEncoder.resolveQuerySet(timestampQuerySet, 0, 2, timestampBuffer, 0);
            }
        }
    }, {
        name: "profilingSystems-cleanup",
        phase: "cleanup",
        run: async () => {
            // End CPU timing for the entire frame
            profilingData.frameEndTime = performance.now();
            profilingData.frameDuration = profilingData.frameEndTime - profilingData.frameStartTime;
            profilingData.frameCount++;

            // Calculate CPU update time (frame time minus render time)
            const updateDuration = profilingData.frameDuration - profilingData.renderDuration;

            // Read GPU timestamps if supported
            if (timestampQuerySet && timestampBuffer) {
                try {
                    await timestampBuffer.mapAsync(GPUMapMode.READ);
                    const timestampArray = new BigUint64Array(timestampBuffer.getMappedRange());
                    
                    // Convert GPU timestamps to milliseconds
                    // GPU timestamps are in nanoseconds, so divide by 1,000,000
                    const gpuStartTime = Number(timestampArray[0]) / 1_000_000;
                    const gpuEndTime = Number(timestampArray[1]) / 1_000_000;
                    profilingData.gpuRenderDuration = gpuEndTime - gpuStartTime;
                    
                    timestampBuffer.unmap();

                    // Log profiling data every 60 frames (approximately once per second at 60fps)
                    if (profilingData.frameCount % 60 === 0) {
                        console.log(`Frame ${profilingData.frameCount}:`);
                        console.log(`  CPU Frame Time: ${profilingData.frameDuration.toFixed(2)}ms`);
                        console.log(`  CPU Render Time: ${profilingData.renderDuration.toFixed(2)}ms`);
                        console.log(`  CPU Update Time: ${updateDuration.toFixed(2)}ms`);
                        console.log(`  GPU Render Time: ${profilingData.gpuRenderDuration.toFixed(2)}ms`);
                        console.log(`  FPS: ${(1000 / profilingData.frameDuration).toFixed(1)}`);
                    }
                } catch (error) {
                    console.warn("Failed to read GPU timestamps:", error);
                }
            } else {
                // CPU-only profiling
                if (profilingData.frameCount % 60 === 0) {
                    console.log(`Frame ${profilingData.frameCount}:`);
                    console.log(`  CPU Frame Time: ${profilingData.frameDuration.toFixed(2)}ms`);
                    console.log(`  CPU Render Time: ${profilingData.renderDuration.toFixed(2)}ms`);
                    console.log(`  CPU Update Time: ${updateDuration.toFixed(2)}ms`);
                    console.log(`  FPS: ${(1000 / profilingData.frameDuration).toFixed(1)}`);
                }
            }
        }
    }]
}; 