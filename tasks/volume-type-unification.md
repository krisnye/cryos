# Volume Type Unification Epic

**Status**: 📋 PLANNED  
**Goal**: Update volume-model plugin and material-volume-to-vertex-buffers system to support both `DenseVolume<T>` and `ColumnVolume<T>` via the unified `Volume<T>` type.

## Overview

Currently, the `volumeModel` plugin and `material-volume-to-vertex-buffers` system only support `DenseVolume<MaterialId>`. We need to extend support to also accept `ColumnVolume<MaterialId>` through the unified `Volume<T>` type, enabling sparse volume storage while maintaining compatibility with existing dense volume code.

The key insight is that `material-volume-to-vertex-buffers` can convert `ColumnVolume` to `DenseVolume` on-the-fly for rendering purposes, without retaining the intermediate dense volume in memory. This allows sparse storage in the ECS while still using the existing dense volume rendering pipeline.

---

## Analysis Phase

### Step 1: Identify All Type References

**Goal**: Find all places where `DenseVolume<MaterialId>` is used in volume-related plugins and systems.

**Files to Analyze**:
1. `cryos/src/plugins/volume-model.ts`
   - Component type: `materialVolume: { default: null as unknown as DenseVolume<MaterialId> }`
   - Transaction signatures: `createVolumeModel`, `setVolumeModel`
   
2. `cryos/src/plugins/material-volume-to-vertex-buffers.ts`
   - Function signatures: `getOpaqueGPUBuffer`, `getTransparentGPUBuffer`, `processEntity`
   - Memoization keys: Currently uses `DenseVolume<MaterialId>` as WeakMap key
   
3. `cryos/src/plugins/volume-model-rendering/material-volume-to-vertex-data.ts`
   - Function signature: `materialVolumeToVertexData(volume: DenseVolume<MaterialId>, ...)`
   - Internal usage: Uses `DenseVolumeNamespace.index()` and `volume.data.get()`

**Analysis Questions**:
- How many places need type updates?
- Are there any type guards or runtime checks for `DenseVolume`?
- What are the performance implications of type discrimination?
- Can memoization work with union types?

---

### Step 2: Analyze Conversion Strategy

**Goal**: Determine the best approach for converting `ColumnVolume` to `DenseVolume` in the rendering pipeline.

**Key Considerations**:

1. **Conversion Point**:
   - Option A: Convert in `material-volume-to-vertex-buffers` system before calling `materialVolumeToVertexData`
   - Option B: Convert inside `materialVolumeToVertexData` function
   - **Recommendation**: Option A - keeps conversion logic separate from rendering logic

2. **Memory Management**:
   - Converted `DenseVolume` should be temporary (not stored in ECS)
   - Should be garbage collected after use
   - Memoization should use original `Volume` as key, not converted `DenseVolume`

3. **Performance Impact**:
   - Conversion cost: `ColumnVolume.toDenseVolume()` - O(n) where n = number of non-empty voxels
   - Caching: Need to ensure memoization works correctly with union types
   - Consider: Should we cache converted dense volumes? (Probably not - defeats purpose of sparse storage)

**Conversion Flow**:
```
ColumnVolume → toDenseVolume() → DenseVolume (temporary) → materialVolumeToVertexData() → VertexData
                                                              ↓
                                                         (garbage collected)
```

---

### Step 3: Type Discrimination Strategy

**Goal**: Determine how to handle type discrimination at runtime.

**Approach**: Use discriminated union with `type` property:
- `DenseVolume<T>` has `type: "dense"`
- `ColumnVolume<T>` has `type: "column"`

**Type Guards Needed**:
```typescript
function isDenseVolume<T>(volume: Volume<T>): volume is DenseVolume<T> {
    return volume.type === "dense";
}

function isColumnVolume<T>(volume: Volume<T>): volume is ColumnVolume<T> {
    return volume.type === "column";
}
```

**Usage Pattern**:
```typescript
function processVolume(volume: Volume<MaterialId>): void {
    const denseVolume = isDenseVolume(volume) 
        ? volume 
        : ColumnVolume.toDenseVolume(volume); // Convert if needed
    
    // Use denseVolume for rendering
    // denseVolume will be garbage collected if it was converted
}
```

---

### Step 4: Memoization Strategy

**Goal**: Ensure memoization works correctly with union types.

**Current Implementation**:
- Uses `WeakMap` with `DenseVolume<MaterialId>` as key
- Caches GPU buffers by volume identity

**Updated Strategy**:
- Use `Volume<MaterialId>` as WeakMap key (union type works fine)
- For `ColumnVolume`: Convert to `DenseVolume` only when needed for rendering
- Cache key remains the original `Volume` (sparse or dense)
- Converted `DenseVolume` is temporary and not cached

**Considerations**:
- WeakMap accepts union types as keys
- Two `ColumnVolume` instances with same data should cache to same GPU buffer
- Need to verify `Volume.equals()` works for both types (already implemented ✅)

---

## Implementation Plan

### Phase 1: Update Type Definitions

**Files to Modify**:
1. `cryos/src/plugins/volume-model.ts`
   - Change component type: `materialVolume: { default: null as unknown as Volume<MaterialId> }`
   - Update transaction signatures to accept `Volume<MaterialId>`

2. `cryos/src/types/volume.ts` (already exists ✅)
   - Verify `Volume<T> = DenseVolume<T> | ColumnVolume<T>` is correct

**Testing**:
- TypeScript compilation should succeed
- No type errors in volume-model plugin

---

### Phase 2: Update material-volume-to-vertex-buffers System

**Files to Modify**:
1. `cryos/src/plugins/material-volume-to-vertex-buffers.ts`
   - Update function signatures to accept `Volume<MaterialId>`
   - Add type guard: `isDenseVolume()`
   - Add conversion logic: Convert `ColumnVolume` to `DenseVolume` before calling `materialVolumeToVertexData`
   - Ensure converted `DenseVolume` is not retained (let GC collect it)

**Key Changes**:
```typescript
// Before
const getOpaqueGPUBuffer = memoize((volume: DenseVolume<MaterialId>): GPUBuffer | undefined => {
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    // ...
});

// After
const getOpaqueGPUBuffer = memoize((volume: Volume<MaterialId>): GPUBuffer | undefined => {
    // Convert ColumnVolume to DenseVolume if needed (temporary, not cached)
    const denseVolume = isDenseVolume(volume) 
        ? volume 
        : ColumnVolume.toDenseVolume(volume);
    
    const vertexData = materialVolumeToVertexData(denseVolume, { opaque: true });
    // denseVolume will be garbage collected if it was converted
    // ...
});
```

**Testing**:
- Unit tests with both `DenseVolume` and `ColumnVolume` inputs
- Verify memoization works correctly
- Verify converted volumes are garbage collected

---

### Phase 3: Update material-volume-to-vertex-data Function

**Files to Modify**:
1. `cryos/src/plugins/volume-model-rendering/material-volume-to-vertex-data.ts`
   - Update function signature to accept `DenseVolume<MaterialId>` (keep as-is)
   - This function only needs to handle `DenseVolume` since conversion happens upstream

**Note**: This function can remain `DenseVolume`-specific since conversion happens before calling it. This keeps the rendering logic simple and focused.

**Testing**:
- Existing tests should continue to pass
- No changes needed to this function's signature

---

### Phase 4: Update Sample Code

**Files to Check**:
1. `cryos/src/samples/volume-model-sample/create-house-chunk.ts`
   - Currently returns `DenseVolume<MaterialId>`
   - Should continue to work (DenseVolume is part of Volume union)

2. `cryos/src/samples/volume-model-sample/volume-model-sample-service.ts`
   - Uses `createVolumeModel` transaction
   - Should work with both volume types

**Testing**:
- Sample application should work with existing dense volumes
- Can optionally test with ColumnVolume if desired

---

## Testing Strategy

### Unit Tests

1. **Type Guards**:
   - Test `isDenseVolume()` with both types
   - Test `isColumnVolume()` with both types

2. **Conversion in material-volume-to-vertex-buffers**:
   - Test `getOpaqueGPUBuffer` with `DenseVolume` (should work as before)
   - Test `getOpaqueGPUBuffer` with `ColumnVolume` (should convert and work)
   - Test `getTransparentGPUBuffer` with both types
   - Verify memoization works (same volume = same GPU buffer)

3. **Memory Management**:
   - Verify converted `DenseVolume` is not retained
   - Verify garbage collection works correctly

### Integration Tests

1. **ECS Integration**:
   - Create entity with `DenseVolume` → verify buffers generated
   - Create entity with `ColumnVolume` → verify buffers generated
   - Update entity volume → verify buffers regenerated

2. **Rendering**:
   - Visual test: Render both dense and column volumes
   - Verify both render identically (same visual output)

---

## Performance Considerations

### Memory Usage

**Before**:
- All volumes stored as `DenseVolume` in ECS
- Memory: `width * height * depth * sizeof(MaterialId)`

**After**:
- Sparse volumes stored as `ColumnVolume` in ECS
- Memory: `(number of non-empty columns) * (avg column height) * sizeof(MaterialId)`
- Temporary `DenseVolume` created during rendering (garbage collected)

**Memory Savings**:
- For sparse volumes: Significant reduction in ECS storage
- Temporary conversion: One-time cost per frame (if volume changes)
- Memoization: Prevents repeated conversions for same volume

### CPU Usage

**Conversion Cost**:
- `ColumnVolume.toDenseVolume()`: O(n) where n = non-empty voxels
- Happens once per unique volume (memoized)
- Only happens when buffers need regeneration

**Rendering Cost**:
- Same as before (uses `DenseVolume` for rendering)
- No additional overhead in rendering pipeline

---

## Migration Path

### Backward Compatibility

**Strategy**: Fully backward compatible
- Existing code using `DenseVolume` continues to work
- `DenseVolume` is part of `Volume` union type
- No breaking changes to existing APIs

### Rollout

1. **Phase 1**: Update types (no behavior change)
2. **Phase 2**: Add conversion logic (enables ColumnVolume support)
3. **Phase 3**: Test with both volume types
4. **Phase 4**: Update documentation and examples

---

## Success Criteria

✅ **Type Safety**:
- TypeScript compiles without errors
- All volume types properly discriminated
- No `any` types introduced

✅ **Functionality**:
- Both `DenseVolume` and `ColumnVolume` work in `volumeModel` plugin
- Both types generate correct GPU buffers
- Both types render identically

✅ **Performance**:
- Memoization works correctly with union types
- Converted volumes are garbage collected
- No memory leaks

✅ **Testing**:
- Unit tests for both volume types
- Integration tests with ECS
- Visual verification of rendering

---

## Files to Modify

### Core Changes
- `cryos/src/plugins/volume-model.ts` - Update component and transaction types
- `cryos/src/plugins/material-volume-to-vertex-buffers.ts` - Add conversion logic

### Supporting Changes
- `cryos/src/types/volume.ts` - Verify union type is correct (already done ✅)

### Tests
- `cryos/src/plugins/material-volume-to-vertex-buffers.test.ts` - Add tests for ColumnVolume
- New: `cryos/src/types/volume.test.ts` - Test type guards

---

## Dependencies

- `ColumnVolume.toDenseVolume()` - Already implemented ✅
- `DenseVolume.equals()` - Already implemented ✅
- `ColumnVolume.equals()` - Already implemented ✅
- Type discrimination via `type` property - Already implemented ✅

---

## Next Steps

1. **Review this plan** with team
2. **Execute Analysis Phase** (Steps 1-4 above)
3. **Implement Phase 1** (Type definitions)
4. **Implement Phase 2** (Conversion logic)
5. **Test and validate**
6. **Update documentation**

---

## Open Questions

1. **Should we cache converted DenseVolumes?**
   - **Answer**: No - defeats purpose of sparse storage. Convert on-demand and let GC collect.

2. **What if ColumnVolume changes?**
   - **Answer**: Memoization key changes, buffers regenerated. This is expected behavior.

3. **Performance impact of conversion?**
   - **Answer**: One-time cost per unique volume per frame. Acceptable for memory savings.

4. **Should we add ColumnVolume creation helpers?**
   - **Answer**: Not in this epic. Can be added later if needed.

