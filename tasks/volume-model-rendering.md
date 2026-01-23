# Volume-Model Rendering System Epic

**Status**: 📋 PLANNED  
**Goal**: Create efficient volume-model rendering system with material-based PBR shading, preserving the caching and instanced rendering efficiency of the old voxel volume system.

## Overview

The old voxel volume rendering system had excellent efficiency through three-stage caching and instanced rendering. This epic adapts that system to use materials instead of colors, creating a PBR-based rendering pipeline that maintains the same level of performance. The system will cache vertex data by volume identity, cache GPU buffers with reference counting, and batch render all instances of the same model in single draw calls.

---

## Create PositionNormalMaterialVertex Type

Create the vertex type for volume model rendering with position, normal, and materialIndex.

**Requirements**:
- Given a vertex type schema, should define position as Vec3
- Given a vertex type schema, should define normal as Vec3
- Given a vertex type schema, should define materialIndex as u32
- Given a vertex type, should use packed layout for efficiency

---

## Create Material Volume to Vertex Data Conversion

Implement the function to convert Volume<MaterialId> to vertex data, similar to rgbaVolumeToVertexData but using material indices.

**Requirements**:
- Given a Volume<MaterialId>, should generate vertices only for visible faces (adjacent to empty voxels)
- Given a Volume<MaterialId>, should store materialIndex per vertex instead of color
- Given a Volume<MaterialId>, should cache vertex data by volume identity
- Given MaterialId === 0, should treat as empty/air voxel
- Given a volume with center option, should offset vertices by center

---

## Create Volume Model Rendering Plugin Core

Create the main rendering plugin structure with components and dependencies.

**Requirements**:
- Given a plugin, should extend volumeModel, scene, and materials plugins
- Given a plugin, should define vertexData component for CPU-side vertex data
- Given a plugin, should define volumeVertexSource component to track volume identity
- Given a plugin, should define modelVertexBuffer component for GPU buffer (transient)
- Given a plugin, should define modelVertexBufferSource component to track vertex data identity

---

## Implement Generate Vertex Data System

Create system that generates vertex data from material volumes with caching.

**Requirements**:
- Given entities with materialVolume, should generate vertex data using materialVolumeToVertexData
- Given multiple entities with same volume, should share cached vertex data
- Given volume identity changes, should regenerate vertex data
- Given vertex data generated, should store in vertexData and track source in volumeVertexSource

---

## Implement Create Vertex Buffers System

Create system that generates GPU buffers from vertex data with reference counting.

**Requirements**:
- Given entities with vertexData, should create GPU buffers
- Given multiple entities with same vertexData, should share GPU buffer with reference counting
- Given vertex data identity changes, should update GPU buffer and update ref counts
- Given ref count reaches zero, should destroy GPU buffer and remove from cache

---

## Implement Render Volume Models System

Create instanced rendering system that batches entities by model type.

**Requirements**:
- Given entities with modelVertexBuffer, should group by vertex buffer
- Given entities in same group, should collect instance transforms (position, scale, rotation)
- Given a model group, should render all instances in single instanced draw call
- Given optional scale/rotation, should handle entities without those components

---

## Create Instanced PBR Shader

Create WebGPU shader for instanced PBR rendering with material lookup.

**Requirements**:
- Given vertex inputs, should transform by instance transform (scale, rotation, position)
- Given materialIndex per vertex, should look up material from materials buffer
- Given material properties, should apply PBR lighting (metallic/roughness workflow)
- Given transparent materials, should discard fully transparent fragments

