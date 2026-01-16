# 📋 Plan: Volume-Model Rendering System

## Current State Analysis

### Completed Implementation ✅

**Phase 1: Core Data Plugin** ✅
- Created `volumeModel` plugin with `volumeModel` tagging component
- Defined `materialVolume: Volume<MaterialId>` component
- Created `VolumeModel` archetype with variants (Scale, Rotation, ScaleRotation)
- Implemented `createVolumeModel` transaction with optional scale/rotation support

**Phase 2: Rendering System** ✅
- Created `PositionNormalMaterialVertex` type (position, normal, materialIndex)
- Implemented `materialVolumeToVertexData()` conversion function
- Created `volumeModelRendering` plugin with three-stage pipeline:
  - `generateVertexData`: Caches vertex data by volume identity
  - `createVertexBuffers`: Caches GPU buffers with reference counting
  - `renderVolumeModels`: Instanced rendering grouped by model type
- Created instanced PBR shader with material lookup

**Phase 3: Sample Application** ✅
- Created `createHouseChunkVolume()` function (16x16x16 house with materials)
- Created `volumeModelSampleService` with axis and house chunk
- Created `volumeModelSampleApplication` LitElement component
- Added sample to sample container

### Key Features Implemented

1. **Efficient Caching** (Preserved from old system):
   - Vertex data cached by `Volume<MaterialId>` identity
   - GPU buffers cached by vertex data identity with reference counting
   - Multiple entities with same volume share cached resources

2. **Instanced Rendering**:
   - Groups entities by vertex buffer (model type)
   - Batches all instances of same model in single draw call
   - Handles optional scale and rotation components

3. **PBR Material System**:
   - Uses materials buffer for material lookup
   - Applies PBR lighting (metallic/roughness workflow)
   - Supports all material properties from Material schema

4. **Sample House Chunk**:
   - 16x16x16 voxels (4m x 4m x 4m at 25cm per voxel)
   - Foundation, walls, windows, roof, interior details
   - Uses concrete, wood, glass, steel materials

## Next Steps & Future Enhancements

### Immediate Testing & Validation
1. **Visual Testing**: Run the sample application and verify:
   - House chunk renders correctly with proper materials
   - Axis renders correctly (from particle rendering)
   - Camera controls work (orbit mode)
   - PBR lighting looks correct

2. **Performance Testing**: Verify caching efficiency:
   - Multiple instances of same volume share vertex data
   - GPU buffer reference counting works correctly
   - Instanced rendering batches correctly

### Short-term Enhancements

1. **Transparent Material Support**:
   - Add transparent rendering variant (like particle-rendering)
   - Depth sorting for transparent volumes
   - Separate rendering pipeline for transparent materials

2. **Volume Manipulation Utilities**:
   - `getVoxel(volume, x, y, z)`: Get material at position
   - `setVoxel(volume, x, y, z, materialId)`: Set material at position
   - `fillVolume(volume, materialId)`: Fill entire volume
   - `copyVolume(volume)`: Create copy of volume

3. **Volume Generation Helpers**:
   - `createBoxVolume(size, materialId)`: Create solid box
   - `createSphereVolume(radius, materialId)`: Create sphere
   - `createHollowBoxVolume(size, wallThickness, materialId)`: Create hollow box

4. **Optimization**:
   - Consider mesh simplification for large volumes
   - LOD (Level of Detail) system for distant volumes
   - Frustum culling for off-screen volumes

### Medium-term Features

1. **Volume Editing**:
   - Real-time voxel editing tools
   - Brush tools (paint, erase, fill)
   - Undo/redo for volume edits

2. **Volume Serialization**:
   - Save/load volume data
   - Compression for sparse volumes
   - Versioning for volume format

3. **Physics Integration**:
   - Volume-based collision detection
   - Destructible volumes
   - Volume-based physics bodies

4. **Advanced Rendering**:
   - Ambient occlusion for volumes
   - Global illumination
   - Shadow mapping for volumes

### Long-term Vision

1. **Volume Streaming**:
   - Load volumes on-demand
   - Streaming for large worlds
   - Chunk-based volume management

2. **Procedural Generation**:
   - Procedural volume generation
   - Noise-based terrain
   - Building generation algorithms

3. **Multi-resolution Volumes**:
   - Octree-based volume representation
   - Adaptive detail levels
   - Efficient memory usage

## Known Issues & Considerations

1. **Material Visibility**: Currently uses `MaterialId === 0` for empty/air. Could enhance to check material definitions.

2. **Center of Mass**: Currently calculated from volume size. Could add as optional component for physics.

3. **Vertex Buffer Layout**: Currently uses packed layout. May need to verify alignment for different GPU architectures.

4. **Instance Data Buffer**: Reuses buffer across groups. May need to optimize for very large instance counts.

## File Structure

```
cryos/src/
  types/
    vertices/
      position-normal-material.ts          ✅
      position-normal-material-namespace.ts ✅
  plugins/
    volume-model.ts                        ✅
    volume-model-rendering/
      index.ts                             ✅
      material-volume-to-vertex-data.ts     ✅
      instanced-pbr.wgsl.ts                ✅
  samples/
    volume-model-sample/
      create-house-chunk.ts                ✅
      volume-model-sample-service.ts        ✅
      volume-model-sample-application.ts    ✅
```

## Dependencies

- `@adobe/data/ecs` - Database.Plugin, Store, TypedBuffer
- `@adobe/data/math` - Vec3, Quat, U32
- `@adobe/data/schema` - Schema, True
- `volumeModel` plugin - Base volume model data
- `scene` plugin - Camera and scene uniforms
- `materials` plugin - Material definitions and GPU buffer
- `particleRendering` plugin - For axis rendering

## Testing Status

✅ All unit tests passing (6 tests)
✅ TypeScript compilation successful (no errors)
✅ No "any" types used
✅ All linter checks passing

## Ready for Visual Testing

The system is complete and ready for visual testing. The sample application can be accessed via:
- URL: `?sample=volume-model-sample`
- Displays: Axis (from particle rendering) + House chunk (16x16x16 volume model)
