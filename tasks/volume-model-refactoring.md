# Volume Model Rendering Refactoring

**Status**: 📋 PLANNED  
**Goal**: Refactor volume model rendering to use generic vertex buffer components and renderers, separating volume-specific logic from rendering logic.

## Overview

Current architecture has volume-specific components and systems tightly coupled. This refactoring:
- Creates generic `material-vertex-buffers` plugin (just components)
- Creates generic `material-vertex-buffer-renderer` plugin (opaque + transparent sub-plugins)
- Creates `material-volume-to-vertex-buffers` plugin (volume-specific, generates buffers)
- Simplifies change detection by using `setVolumeModel` transaction to invalidate buffers

---

## Phase 1: Create material-vertex-buffers Plugin

Create a data-only plugin that defines the vertex buffer components.

**Requirements**:
- Define `opaqueVertexBuffer: GPUBuffer | null` component
- Define `transparentVertexBuffer: GPUBuffer | null` component
- No systems, just component definitions
- Generic enough to work with any vertex buffer source (volumes, loaded geometry, etc.)

**Files to Create**:
- `cryos/src/plugins/material-vertex-buffers.ts`

**Implementation**:
```typescript
export const materialVertexBuffers = Database.Plugin.create({
    components: {
        opaqueVertexBuffer: { default: null as unknown as GPUBuffer, transient: true },
        transparentVertexBuffer: { default: null as unknown as GPUBuffer, transient: true },
    },
});
```

---

## Phase 2: Update volume-model Plugin

Extend `volume-model` plugin from `material-vertex-buffers` and add `setVolumeModel` transaction.

**Requirements**:
- `volume-model` extends `material-vertex-buffers`
- Add `setVolumeModel` transaction that:
  - Updates `materialVolume` component
  - **Removes** `opaqueVertexBuffer` and `transparentVertexBuffer` components (not set to null, actually removed)
  - This invalidates buffers when volume changes, triggering regeneration

**Files to Modify**:
- `cryos/src/plugins/volume-model.ts`

**Implementation**:
```typescript
export const volumeModel = Database.Plugin.create({
    extends: materialVertexBuffers,  // NEW
    components: {
        volumeModel: True.schema,
        materialVolume: { default: null as unknown as Volume<MaterialId> },
    },
    transactions: {
        createVolumeModel(t, props) { /* existing */ },
        setVolumeModel(t, props: { entityId: Entity, materialVolume: Volume<MaterialId> }) {
            // Update materialVolume and remove buffer components
            // Setting components to undefined removes them from the entity
            t.update(props.entityId, {
                materialVolume: props.materialVolume,
                opaqueVertexBuffer: undefined,
                transparentVertexBuffer: undefined,
            });
            // This invalidates buffers, causing material-volume-to-vertex-buffers to regenerate
        },
    },
});
```

**Note**: Component removal is done by setting to `undefined` in `t.update()`. The ECS automatically removes components when their value is `undefined`.

---

## Phase 3: Create material-vertex-buffer-renderer Plugin

Create generic renderer plugin with opaque and transparent sub-plugins.

**Requirements**:
- `opaque-vertex-buffer-renderer` sub-plugin:
  - Queries: `[opaqueVertexBuffer, position]` (+ optional `scale`, `rotation`)
  - Groups by `opaqueVertexBuffer` identity (for instanced rendering)
  - Uses opaque render pipeline (depth write enabled, no blending)
- `transparent-vertex-buffer-renderer` sub-plugin:
  - Queries: `[transparentVertexBuffer, position, transparent]` (+ optional `scale`, `rotation`)
  - Groups by `transparentVertexBuffer` identity (for instanced rendering)
  - Uses transparent render pipeline (blending, depth write disabled)
  - TODO: Phase 3 of transparent epic will add depth sorting
- Shared code: instance data buffer creation, pipeline setup, etc.

**Files to Create**:
- `cryos/src/plugins/material-vertex-buffer-renderer/opaque-vertex-buffer-renderer.ts`
- `cryos/src/plugins/material-vertex-buffer-renderer/transparent-vertex-buffer-renderer.ts`
- `cryos/src/plugins/material-vertex-buffer-renderer/shared.ts` (optional, for shared utilities)
- `cryos/src/plugins/material-vertex-buffer-renderer/index.ts` (combines sub-plugins)

**Key Points**:
- Renderer has NO knowledge of volumes - it just renders any entity with vertex buffers
- Can be reused for loaded geometry, procedural meshes, etc.
- Grouping by buffer identity automatically handles instancing (same buffer = same model)

---

## Phase 4: Create material-volume-to-vertex-buffers Plugin

Create volume-specific system that generates vertex buffers from volumes.

**Requirements**:
- System queries: `[volumeModel, materialVolume]` entities that are missing BOTH `opaqueVertexBuffer` AND `transparentVertexBuffer`
- Uses memoized functions with WeakMap for caching:
  - `WeakMap<Volume<MaterialId>, TypedBuffer>` for opaque vertex data
  - `WeakMap<Volume<MaterialId>, TypedBuffer>` for transparent vertex data
  - `Map<TypedBuffer, GPUBuffer>` for GPU buffer cache (keyed by vertex data identity)
- For each entity:
  - Generate opaque vertex data (if volume has opaque materials)
  - Generate transparent vertex data (if volume has transparent materials)
  - Create/get GPU buffers from caches
  - Set `opaqueVertexBuffer` and/or `transparentVertexBuffer` components
- **NO change detection needed** - transaction invalidates buffers, query finds missing ones

**Files to Create**:
- `cryos/src/plugins/material-volume-to-vertex-buffers.ts`

**Implementation Notes**:
- Query: `queryArchetypes(["volumeModel", "materialVolume"], { exclude: ["opaqueVertexBuffer", "transparentVertexBuffer"] })`
  - OR: Query all and check if both buffers are null
- Only sets buffers if vertex data has `capacity > 0` (visible faces)
- Uses `materialVolumeToVertexData(volume, { opaqueOnly: true })` for opaque
- Uses `materialVolumeToVertexData(volume, { opaqueOnly: false })` for transparent
- No ref counting - buffers persist (cleanup deferred to future disposer functions)
- Buffer sharing: Multiple entities with same volume share same GPUBuffer object (via cache)

---

## Phase 5: Update markTransparentVolumeModels

Update the transparent marking system to work with new buffer components.

**Requirements**:
- Query: `[volumeModel, materialVolume]`
- Check: Entity has `opaqueVertexBuffer` OR `transparentVertexBuffer` (indicates visible faces)
- Check: Volume contains transparent materials (`checkMaterialTypes`)
- Set: `transparent: true` if both conditions hold

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/mark-transparent-volume-models.ts`

**Changes**:
- Replace `volumeModelVertexData` check with `opaqueVertexBuffer || transparentVertexBuffer` check
- Still needs `checkMaterialTypes` to determine if volume has transparent materials

---

## Phase 6: Update volume-model-rendering Index

Update the main plugin to use new architecture.

**Requirements**:
- Remove old systems: `generateVolumeModelVertexData`, `createVertexBuffers`
- Add new systems: `materialVolumeToVertexBuffers`
- Keep: `markTransparentVolumeModels` (updated)
- Remove: `renderVolumeModels`, `renderVolumeModelsTransparent` (replaced by generic renderer)
- Combine: `materialVertexBufferRenderer` (opaque + transparent)

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/index.ts`

**New Structure**:
```typescript
export const volumeModelRendering = Database.Plugin.combine(
    materialVolumeToVertexBuffers,      // Generates buffers from volumes
    markTransparentVolumeModels,         // Marks transparent entities
    // Note: materialVertexBufferRenderer is separate, not volume-specific
);
```

---

## Architecture Comparison

### Current Architecture
```
volumeModel
  ↓
generateVolumeModelVertexData → volumeModelVertexData (CPU)
  ↓
createVertexBuffers → modelVertexBuffer (GPU)
  ↓
renderVolumeModels (opaque)
renderVolumeModelsTransparent (transparent)
```

### New Architecture
```
volumeModel (extends materialVertexBuffers)
  ↓
setVolumeModel transaction → invalidates buffers
  ↓
materialVolumeToVertexBuffers → opaqueVertexBuffer, transparentVertexBuffer
  ↓
materialVertexBufferRenderer (opaque + transparent) → renders any entity with buffers
```

---

## Benefits

1. **Separation of Concerns**: Renderer is generic, volume logic is isolated
2. **Simpler Change Detection**: Transaction invalidates, system fills gaps
3. **Reusability**: Renderer works with any vertex buffer source
4. **Cleaner Components**: Only final buffers, no intermediate state
5. **Future-Proof**: Easy to add loaded geometry, procedural meshes, etc.

---

## Migration Path

### Current Architecture (Before Migration)

```
volume-model-rendering-data
  volumeModelVertexData: TypedBuffer<PositionNormalMaterialVertex>
  volumeModelVertexSource: Volume<MaterialId>
  modelVertexBuffer: GPUBuffer
  modelVertexBufferSource: TypedBuffer<PositionNormalMaterialVertex>

generate-vertex-data
  generateVolumeModelVertexData { reads materialVolume, writes volumeModelVertexData }

create-vertex-buffers
  createVertexBuffers { reads volumeModelVertexData, writes modelVertexBuffer }

volume-model-rendering
  renderVolumeModels { reads modelVertexBuffer, position, scale?, rotation? }
  renderVolumeModelsTransparent { reads modelVertexBuffer, position, transparent, scale?, rotation? }
  markTransparentVolumeModels { reads volumeModel, materialVolume, writes transparent }
```

### Target Architecture (After Migration)

```
material-vertex-buffers
  opaqueVertexBuffer: GPUBuffer
  transparentVertexBuffer: GPUBuffer

volume-model (extends material-vertex-buffers)
  volumeModel: true
  materialVolume: Volume<MaterialId>

material-volume-to-vertex-buffers
  materialVolumeToVertexBuffers { reads materialVolume, writes opaqueVertexBuffer and/or transparentVertexBuffer }

material-vertex-buffer-renderer
  renderOpaqueVertexBuffers { reads opaqueVertexBuffer, position, scale?, rotation? }
  renderTransparentVertexBuffers { reads transparentVertexBuffer, position, scale?, rotation? }

volume-model-rendering
  markTransparentVolumeModels { reads volumeModel, materialVolume, opaqueVertexBuffer, transparentVertexBuffer, writes transparent }
```

---

## Migration Phases

### Phase 1: Add New Components (Parallel System)

**Goal**: Add new components and systems alongside existing ones without breaking current functionality.

**Steps**:
1. Create `material-vertex-buffers` plugin with `opaqueVertexBuffer` and `transparentVertexBuffer` components
2. Update `volume-model` to extend `material-vertex-buffers` (adds new components to existing entities)
3. Create `material-volume-to-vertex-buffers` plugin with `materialVolumeToVertexBuffers` system
   - System queries: `[volumeModel, materialVolume]` WHERE (`opaqueVertexBuffer` missing AND `transparentVertexBuffer` missing)
   - Generates both opaque and transparent buffers (if volume has visible faces)
   - Uses same caching logic as current `generateVolumeModelVertexData` but writes to new components
4. **Keep existing systems running** - both old and new systems will populate their respective components

**Testing**:
- Verify new components are added to entities
- Verify new system generates buffers correctly
- Verify existing rendering still works (uses old `modelVertexBuffer`)
- Unit tests for new system

**Files to Create**:
- `cryos/src/plugins/material-vertex-buffers.ts`
- `cryos/src/plugins/material-volume-to-vertex-buffers.ts`

**Files to Modify**:
- `cryos/src/plugins/volume-model.ts` (add `extends: materialVertexBuffers`)

---

### Phase 2: Create Generic Renderer (Parallel System)

**Goal**: Create new generic renderer that works with new buffer components, running alongside old renderer.

**Steps**:
1. Create `material-vertex-buffer-renderer` plugin with:
   - `renderOpaqueVertexBuffers` system (reads `opaqueVertexBuffer`, position, scale?, rotation?)
   - `renderTransparentVertexBuffers` system (reads `transparentVertexBuffer`, position, scale?, rotation?)
2. Copy rendering logic from `render-volume-models.ts` and `render-volume-models-transparent.ts`
3. Adapt to use new buffer components instead of `modelVertexBuffer`
4. **Keep old renderers active** - both old and new renderers will render (may see duplicates temporarily)

**Testing**:
- Verify new renderer works with new buffer components
- Verify both opaque and transparent rendering work
- Visual test: should see models rendered twice (old + new) - confirms both systems work
- Unit tests for new renderer

**Files to Create**:
- `cryos/src/plugins/material-vertex-buffer-renderer/opaque-vertex-buffer-renderer.ts`
- `cryos/src/plugins/material-vertex-buffer-renderer/transparent-vertex-buffer-renderer.ts`
- `cryos/src/plugins/material-vertex-buffer-renderer/index.ts`

---

### Phase 3: Add setVolumeModel Transaction

**Goal**: Add transaction to invalidate buffers when volume changes.

**Steps**:
1. Add `setVolumeModel` transaction to `volume-model` plugin
2. Transaction updates `materialVolume` and removes `opaqueVertexBuffer` and `transparentVertexBuffer`
3. Test transaction works correctly
4. **Old systems still handle volume changes** via `volumeModelVertexSource` tracking

**Testing**:
- Unit test: `setVolumeModel` removes buffer components
- Integration test: Changing volume via transaction triggers buffer regeneration
- Verify old systems still work for entities not using transaction

**Files to Modify**:
- `cryos/src/plugins/volume-model.ts` (add `setVolumeModel` transaction)

---

### Phase 4: Switch to New Renderer (Remove Old Renderers)

**Goal**: Use only new renderer, remove old renderers.

**Steps**:
1. Update `volume-model-rendering/index.ts`:
   - Remove `renderVolumeModels` and `renderVolumeModelsTransparent` from plugin combination
   - Add `materialVertexBufferRenderer` to sample/application plugins (not volume-specific)
2. **Keep old buffer generation systems** - still generating `modelVertexBuffer` for now
3. Verify rendering works with new renderer only

**Testing**:
- Visual test: models should render once (new renderer only)
- Verify no rendering regressions
- Verify both opaque and transparent rendering work

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/index.ts`
- Sample/application files that combine plugins

---

### Phase 5: Update markTransparentVolumeModels

**Goal**: Update transparent marking to use new buffer components.

**Steps**:
1. Update `markTransparentVolumeModels` system:
   - Change query to check for `opaqueVertexBuffer` OR `transparentVertexBuffer` (instead of `volumeModelVertexData`)
   - Still uses `checkMaterialTypes` to determine if volume has transparent materials
2. **Keep old systems generating buffers** - both old and new buffer components exist

**Testing**:
- Verify transparent marking works with new buffer components
- Verify entities with transparent materials are marked correctly
- Unit tests for updated system

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/mark-transparent-volume-models.ts`

---

### Phase 6: Remove Old Buffer Generation Systems

**Goal**: Stop generating old buffer components, use only new system.

**Steps**:
1. Remove `generateVolumeModelVertexData` from plugin combination
2. Remove `createVertexBuffers` from plugin combination
3. Update `volume-model-rendering/index.ts` to only include `markTransparentVolumeModels`
4. **Old components remain in schema** but are no longer populated

**Testing**:
- Verify new `materialVolumeToVertexBuffers` system handles all buffer generation
- Verify rendering still works (uses new buffers)
- Verify no entities have old `modelVertexBuffer` component after regeneration
- Unit tests pass

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/index.ts`
- Remove imports of `generateVolumeModelVertexData` and `createVertexBuffers`

---

### Phase 7: Remove Old Components

**Goal**: Remove old components from schema and clean up.

**Steps**:
1. Remove old components from `volume-model-rendering-data.ts`:
   - `volumeModelVertexData`
   - `volumeModelVertexSource`
   - `modelVertexBuffer`
   - `modelVertexBufferSource`
2. Delete `volume-model-rendering-data.ts` (no longer needed)
3. Update any remaining references to old components
4. Clean up old system files:
   - `generate-vertex-data.ts`
   - `create-vertex-buffers.ts`
   - `render-volume-models.ts`
   - `render-volume-models-transparent.ts`

**Testing**:
- Verify no TypeScript errors
- Verify all tests pass
- Verify rendering works correctly
- Visual test: verify no regressions

**Files to Delete**:
- `cryos/src/plugins/volume-model-rendering/volume-model-rendering-data.ts`
- `cryos/src/plugins/volume-model-rendering/generate-vertex-data.ts`
- `cryos/src/plugins/volume-model-rendering/create-vertex-buffers.ts`
- `cryos/src/plugins/volume-model-rendering/render-volume-models.ts`
- `cryos/src/plugins/volume-model-rendering/render-volume-models-transparent.ts`

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/index.ts` (remove old imports)
- Any tests that reference old components

---

## Migration Safety Checklist

After each phase:
- ✅ TypeScript compiles without errors
- ✅ Unit tests pass
- ✅ Visual rendering works (no regressions)
- ✅ No console errors or warnings
- ✅ Performance acceptable (no significant degradation)

Rollback strategy:
- Each phase can be rolled back by reverting the commit
- Old systems remain functional until Phase 6
- Can pause migration at any phase and continue later

---

## Dependencies

- `material-vertex-buffers` - Component definitions
- `volume-model` - Extends material-vertex-buffers, provides setVolumeModel
- `material-vertex-buffer-renderer` - Generic renderer (opaque + transparent)
- `material-volume-to-vertex-buffers` - Volume-specific buffer generation
- `material-volume-to-vertex-data.ts` - Existing function (reuse)
- `transparent` plugin - For marking transparent entities

---

## Success Criteria

✅ Generic renderer works with any vertex buffer source  
✅ Volume-specific logic isolated to one plugin  
✅ Change detection simplified (transaction-based invalidation)  
✅ No intermediate components in ECS (only final buffers)  
✅ Buffer sharing works via GPUBuffer identity  
✅ All existing tests pass  
✅ Performance maintained (caching, instancing)

