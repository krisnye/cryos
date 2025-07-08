# Profiling Systems

This directory contains profiling systems for measuring performance in your WebGPU application.

## Available Systems

### 1. `profiling-systems.ts` - CPU-Only Profiling

A lightweight profiling system that uses high-resolution CPU timing to measure:

- **CPU Frame Time**: Total time for the entire frame (input to cleanup)
- **CPU Render Time**: Time spent in the render phase (preRender to postRender)
- **CPU Update Time**: Time spent in update phases (calculated as frame time minus render time)
- **FPS**: Frames per second

### 2. `profiling-systems-gpu.ts` - Advanced Profiling with GPU Support

An advanced profiling system that includes:

- All CPU timing from the basic system
- GPU timestamp queries (when supported by the device)
- Automatic fallback to CPU-only profiling when GPU timestamps aren't available

## Usage

### Basic CPU Profiling

```typescript
import { profilingSystems } from './profiling-systems.js';

// Add to your system service
const systems = [
    ...profilingSystems(main),
    // ... your other systems
];
```

### Advanced GPU Profiling

```typescript
import { profilingSystemsWithGPU } from './profiling-systems-gpu.js';

// Add to your system service
const systems = [
    ...profilingSystemsWithGPU(main),
    // ... your other systems
];
```

## Output

The systems log performance data every 60 frames (approximately once per second at 60fps):

```
Frame 60:
  CPU Frame Time: 16.67ms
  CPU Render Time: 8.45ms
  CPU Update Time: 8.22ms
  GPU Render Time: 7.89ms  // Only available with GPU profiling
  FPS: 60.0
```

## System Phases

The profiling systems use the following ECS phases:

- **input**: Starts CPU frame timing
- **preRender**: Starts CPU render timing (and GPU timing if available)
- **postRender**: Ends CPU render timing (and GPU timing if available)
- **cleanup**: Ends CPU frame timing and logs results

## GPU Timestamp Queries

The advanced system includes support for GPU timestamp queries, which provide more accurate GPU render timing. However, this feature:

1. Requires the `timestamp-query` feature to be enabled on the device
2. May not be available on all devices/browsers
3. Automatically falls back to CPU-only profiling when not supported

## Performance Considerations

- Profiling adds minimal overhead (microseconds per frame)
- Logging only occurs every 60 frames to avoid console spam
- The systems use high-resolution timers for accurate measurements
- GPU timestamp queries are asynchronous and don't block the main thread

## Future Enhancements

When WebGPU timestamp query APIs become more widely available, the GPU profiling system can be enhanced to:

- Provide more granular GPU timing (per-pass, per-draw call)
- Support multiple timestamp queries per frame
- Include GPU-CPU synchronization timing
- Provide real-time performance graphs 