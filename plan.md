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

### Active Work

1. **Dense Volume Type Renaming** ✅ (COMPLETED):
   - Detailed plan: See `tasks/dense-volume-type-renaming.md`
   - Renamed `Volume<T>` to `DenseVolume<T>` with `type: "dense"` discriminator
   - Renamed `VolumeMaterial` to `DenseVolumeMaterial`
   - Updated all imports, type references, and documentation

2. **DenseVolume to ColumnVolume Conversion** ✅ (COMPLETED):
   - Detailed plan: See `tasks/dense-to-column-volume-conversion.md`
   - Implemented `ColumnVolume.create()` function to convert DenseVolume to ColumnVolume
   - Enabled sparse storage for volumes with many empty regions
   - Supports variable column heights and z-offsets for terrain-like data
   - Helper functions: `packColumnInfo`, `unpackColumnInfo`, `isEmptyColumn`
   - Comprehensive test coverage (10 tests)

3. **ColumnVolume to DenseVolume Conversion** ✅ (COMPLETED):
   - Detailed plan: See `tasks/column-volume-to-dense-volume-conversion.md`
   - Implemented `ColumnVolume.toDenseVolume()` function to convert ColumnVolume back to DenseVolume
   - Enabled round-trip conversion for testing and compatibility
   - Fill empty regions with schema default values
   - Handle columns with z-offsets and gaps correctly

4. **Volume Type Unification** ⬜ (PLANNED):
   - Detailed plan: See `tasks/volume-type-unification.md`
   - Update `volumeModel` plugin to accept `Volume<MaterialId>` (union of DenseVolume and ColumnVolume)
   - Update `material-volume-to-vertex-buffers` to handle both types
   - Convert ColumnVolume to DenseVolume on-the-fly for rendering (temporary, not retained)
   - Enable sparse volume storage in ECS while maintaining dense rendering pipeline

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

1. **Transparent Material Support** ⬜ (PLANNED):
   - Detailed plan: See `tasks/volume-model-transparent-rendering.md`
   - Add transparent rendering variant (like particle-rendering)
   - Depth sorting for transparent volumes
   - Separate rendering pipeline for transparent materials
   - Mark transparent volume models using existing `transparent` plugin
   - Sort transparent instances by depth from camera
   - Render transparent volumes after opaque volumes

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

### Investigation: Material Physical Properties (Heat & Sunlight) 🔬

**Status**: Investigation complete. See `tasks/material-physical-properties-investigation.md`.

**Findings**:
- ✅ Schema has `density`, `specificHeatCapacity`, `thermalConductivity`, `irReflectance` — values are physically plausible
- ✅ PhysicalVoxel stores per-voxel temperature (bits 23–12, 0–4095 K)
- ❌ Thermal properties are **not used** in simulation or rendering
- ❌ No solar irradiance (W/m²) in scene; `irReflectance`/`irEmission` semantics undocumented

**Feasibility**: Heat capacity and sunlight heating are **structurally ready**; a thermal simulation system is needed to use them. Recommended next steps: document irReflectance semantics, add `solarIrradiance` to scene, implement minimal thermal tick for sun-facing voxels.

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
      position-normal-material/            ✅ (reorganized into folder)
  plugins/
    volume-model.ts                        ✅
    volume-model-rendering/
      index.ts                             ✅
      volume-model-rendering-data.ts       ✅ (shared components)
      generate-vertex-data.ts              ✅ (system)
      create-vertex-buffers.ts             ✅ (system)
      render-volume-models.ts              ✅ (system)
      material-volume-to-vertex-data.ts    ✅
      instanced-pbr.wgsl.ts                ✅
      render-volume-models-transparent.ts  ⬜ (planned - transparent rendering)
      sort-volume-model-instances.ts       ⬜ (planned - sorting utilities)
  samples/
    volume-model-sample/
      create-house-chunk.ts                ✅
      volume-model-sample-service.ts        ✅
      volume-model-sample-application.ts    ✅
  tasks/
    volume-model-rendering.md                      ✅ (original epic)
    volume-model-transparent-rendering.md          ✅ (new - transparent epic)
    dense-volume-type-renaming.md                  ✅ (completed - type renaming)
    dense-to-column-volume-conversion.md           ⬜ (planned - conversion function)
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

## Agent Skills Organization ✅

**Skill Refactoring** (Completed):
- Created `functional-programming` skill for general FP principles (immutability, no classes/enums, code style)
- Refactored `write-ecs-plugins` skill to focus on ECS-specific patterns (reduced to ~240 lines, kept detailed resources/closure guidance)
- Created `write-types` skill documenting Material pattern as template for complex types, single file for simple types
- Skills now reference each other for better organization and reusability

## Types Audit ✅ (COMPLETED)

**Types Standardization** (Completed):
- Detailed plan: See `tasks/types-audit.md`
- Audited all types in `src/types/` against Material pattern standard
- Fixed 7 inconsistent types:
  - ✅ Camera: Added namespace export, removed `index.ts`
  - ✅ ColumnVolume: Removed `index.ts`
  - ✅ DenseVolume: Removed `index.ts`
  - ✅ DenseVolumeMaterial: Simplified to single file (removed folder)
  - ✅ SchemaX: Created `schema-x.ts`, removed `index.ts`
  - ✅ PositionColorNormalVertex: Removed `index.ts`
  - ✅ PositionNormalMaterialVertex: Removed `index.ts`
- Updated all import paths in codebase to use `{type-name}/{type-name}.ts` pattern
- Updated `write-types` skill to explicitly state no `index.ts` files (for convenient Command+P navigation)
- All types now follow Material pattern: `<type-name>.ts` for simple types, `{type-name}/{type-name}.ts` + `public.ts` for complex types

## Ready for Visual Testing

The system is complete and ready for visual testing. The sample application can be accessed via:
- URL: `?sample=volume-model-sample`
- Displays: Axis (from particle rendering) + House chunk (16x16x16 volume model)
