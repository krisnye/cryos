# Volume Model Rendering Plugin Architecture

This document describes the plugin architecture for volume model rendering using the plugin definition format.

## Overview

Volume model rendering is split into generic and volume-specific plugins:

- **Generic plugins**: Work with any vertex buffer source (volumes, loaded geometry, etc.)
- **Volume-specific plugins**: Convert `Volume<MaterialId>` to vertex buffers

This separation allows the generic renderers to be reused for other geometry sources.

## Plugin Definitions

```
material-vertex-buffers
  opaqueVertexBuffer: GPUBuffer
  transparentVertexBuffer: GPUBuffer

volume-model
  volumeModel: true
  materialVolume: Volume<MaterialId>
  createVolumeModel { creates entity with volumeModel, materialVolume, position, optional scale/rotation }
  setVolumeModel { updates materialVolume, removes opaqueVertexBuffer and transparentVertexBuffer }

material-volume-to-vertex-buffers
  materialVolumeToVertexBuffers { reads materialVolume, writes opaqueVertexBuffer and/or transparentVertexBuffer }

material-vertex-buffer-renderer
  renderOpaqueVertexBuffers { reads opaqueVertexBuffer, position, scale?, rotation? }
  renderTransparentVertexBuffers { reads transparentVertexBuffer, position, scale?, rotation? }
```

## Data Flow

1. **Create Volume Model**: `createVolumeModel` transaction creates entity with `materialVolume` component
2. **Generate Buffers**: `materialVolumeToVertexBuffers` system detects missing buffers and generates them from `materialVolume`
3. **Render Opaque**: `renderOpaqueVertexBuffers` queries entities with `opaqueVertexBuffer` and renders them
4. **Render Transparent**: `renderTransparentVertexBuffers` queries entities with `transparentVertexBuffer` and renders them (after opaque)

## Change Detection

When a volume changes:
1. `setVolumeModel` transaction is called
2. Transaction updates `materialVolume` and **removes** `opaqueVertexBuffer` and `transparentVertexBuffer` components
3. Next frame, `materialVolumeToVertexBuffers` detects missing buffers (via query exclusion) and regenerates them

## Buffer Caching

- **CPU-side vertex data**: Memoized by `Volume<MaterialId>` identity (WeakMap) in `materialVolumeToVertexData`
- **GPU buffers**: Memoized by `Volume<MaterialId>` identity (WeakMap) in `getOpaqueGPUBuffer` and `getTransparentGPUBuffer`
- **Instance buffers**: Reused per vertex buffer group in renderers (Map<GPUBuffer, GPUBuffer>)

## Rendering Optimizations

- **Instanced rendering**: Entities with the same vertex buffer are grouped and rendered in a single draw call
- **Pipeline reuse**: Render pipelines are created once and reused
- **Depth sorting**: Transparent rendering currently renders in query order (future: back-to-front sorting)

