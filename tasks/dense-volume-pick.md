# 📋 Plan: DenseVolume.pick() Implementation

## Overview

Implement `DenseVolume.pick()` function using the DDA (Digital Differential Analyzer) algorithm from `cryos-old`. This function will traverse voxels along a ray and return the first pickable voxel encountered.

## Current State

### Existing Types ✅
- `PickResult` - Base pick result type (entity, positions, alpha)
- `VoxelPickResult` - Extends PickResult with voxel coordinates and face
- `DenseVolume<T>` - Type with `type: "dense"`, `size: Vec3`, `data: TypedBuffer<T>`

### Existing DenseVolume Functions ✅
- `DenseVolume.getIndex(volume, x, y, z)` - Get voxel index from coordinates
- `DenseVolume.getCoordinates(volume, index)` - Get coordinates from index
- `DenseVolume.is(volume)` - Type guard

### Old Implementation Reference
- `cryos-old/src/data/volume/volume.ts` - Contains `Volume.pick()` with DDA algorithm
- Returns `VolumePickResult` with `{ index, alpha, face }`
- Uses `AabbFace` constants directly (e.g., `AabbFace.POS_Z`)

## Implementation Plan

### Phase 1: Core Pick Function

**File**: `cryos/src/types/dense-volume/pick.ts`

**Function Signature**:
```typescript
export const pick = <T>(
    volume: DenseVolume<T>,
    line: Line3,
    pickable: (voxel: T) => boolean
): { coordinates: Vec3; alpha: number; face: AabbFace } | null
```

**Return Type**: Object with `coordinates`, `alpha`, and `face` (matches `VoxelPickResult.voxel` structure)

**Key Adaptations from Old Implementation**:

1. **Return Type**: 
   - Old: `VolumePickResult` with `index: number`
   - New: Object with `coordinates: Vec3` (convert index to coordinates), `alpha`, and `face: AabbFace`

2. **AabbFace Type**:
   - Import `AabbFace` from `@adobe/data/math/aabb/face/index` (already exists)
   - Use `Aabb.Face.POS_Z` etc. for constants (namespace access)

3. **Index Calculation**:
   - Use `DenseVolume.getIndex(volume, x, y, z)` for consistency
   - Use `DenseVolume.getCoordinates(volume, index)` to convert back to coordinates for result

4. **Algorithm Steps** (same as old):
   - Broad-phase AABB intersection test
   - DDA voxel traversal
   - Face detection based on step direction
   - Return first pickable voxel

**Dependencies**:
- `@adobe/data/math`: `Aabb`, `Line3`, `Vec3`
- `@adobe/data/math/aabb/face/index`: `AabbFace` type
- `Aabb.Face` namespace for face constants (POS_Z, NEG_X, etc.)
- `DenseVolume.getIndex()` and `DenseVolume.getCoordinates()`

### Phase 2: Unit Tests

**File**: `cryos/src/types/dense-volume/pick.test.ts`

**Test Cases** (adapted from `cryos-old/src/data/volume/volume.test.ts`):

1. **Picking from different directions**:
   - Positive X direction
   - Negative X direction
   - Positive Y direction
   - Positive Z direction
   - Diagonal direction

2. **Picking closest voxel**:
   - First pickable voxel in sequence
   - Skip non-pickable voxels

3. **Edge cases**:
   - No pickable voxel found
   - Ray misses volume entirely (broad-phase)
   - Ray misses volume diagonally
   - Ray starts after volume
   - Ray starts inside volume
   - Zero-length ray

4. **Different volume sizes**:
   - 1x1x1 volume
   - Flat 10x10x1 volume
   - Tall 1x1x10 volume
   - Large 20x20x20 volume

5. **Custom pickable predicates**:
   - Pick only specific material IDs
   - Pick first matching material

**Test Adaptations**:
- Use `MaterialId` instead of `Rgba`
- Use `Material.ids.air` for non-pickable voxels
- Use `Material.ids.rock`, `Material.ids.steel`, etc. for pickable voxels
- Verify `coordinates` instead of `index`
- Use `Aabb.Face` constants

### Phase 3: Namespace Export

**File**: `cryos/src/types/dense-volume/public.ts`

Add export:
```typescript
export * from "./pick.js";
```

### Phase 4: Type Safety & Validation

**Considerations**:
- Use existing `AabbFace` type (import from `@adobe/data/math/aabb/face/index`)
- Return structure matches `VoxelPickResult.voxel` (can be used to construct full `VoxelPickResult` later)
- Verify coordinates are correctly calculated from index
- Ensure face constants match expected values
- Handle edge cases (zero-length rays, out-of-bounds)

## Implementation Details

### DDA Algorithm Overview

1. **Broad-phase**: Check if ray intersects volume AABB
   - Use `Aabb.lineIntersection()` 
   - Return `null` if no intersection

2. **Initialize DDA**:
   - Calculate ray direction and normalize
   - Calculate step sizes for each axis
   - Initialize voxel coordinates (floor of entry point)
   - Calculate initial `tMax` values for each axis

3. **Traverse voxels**:
   - While within bounds and iteration limit:
     - Check if current voxel is pickable
     - If pickable, return object with coordinates, alpha, and face
     - Step to next voxel boundary (always nearest)
     - Track entry face based on step direction

4. **Return result**:
   - Convert voxel index to coordinates using `DenseVolume.getCoordinates()`
   - Return object with:
     - `coordinates`: Vec3 from `getCoordinates()`
     - `face`: AabbFace from step direction
     - `alpha`: Alpha along ray

### Return Type Decision

`DenseVolume.pick()` is a low-level function that operates on volumes in model space. It returns an object with `coordinates`, `alpha`, and `face` that matches the structure of `VoxelPickResult.voxel`. 

Higher-level picking functions (with entity context) can use this result to construct a full `VoxelPickResult`:
```typescript
const voxelPick = DenseVolume.pick(volume, line, pickable);
if (voxelPick) {
    const voxelPickResult: VoxelPickResult = {
        entity,
        lineAlpha: voxelPick.alpha,
        worldPosition: /* transform modelPosition */,
        modelPosition: /* calculate from line and alpha */,
        voxel: {
            coordinates: voxelPick.coordinates,
            face: voxelPick.face
        }
    };
}
```

## File Structure

```
cryos/src/types/dense-volume/
  pick.ts                   ⬜ (new - pick function)
  pick.test.ts              ⬜ (new - unit tests)
  public.ts              ✅ (update - add pick export)
```

## Dependencies

- `@adobe/data/math`: `Aabb`, `Line3`, `Vec3`
- `@adobe/data/math/aabb/face/index`: `AabbFace` type
- `Aabb.Face` namespace for face constants
- `DenseVolume.getIndex()` - For index calculation
- `DenseVolume.getCoordinates()` - For coordinate conversion
- `Material.ids` - For test data

## Success Criteria

1. ✅ `DenseVolume.pick()` function implemented
2. ✅ Returns object with `coordinates`, `alpha`, `face` (matches `VoxelPickResult.voxel` structure)
3. ✅ Uses DDA algorithm correctly
4. ✅ Handles all edge cases
5. ✅ Unit tests pass (19+ test cases)
6. ✅ Follows type standards (single function file)
7. ✅ Exported from namespace
8. ✅ Uses existing `AabbFace` type (no new types)
9. ✅ No Adobe license headers
10. ✅ TypeScript compiles without errors

## Testing Strategy

1. **TDD Approach**: Write tests first, then implement
2. **Port existing tests**: Adapt all 19+ tests from old implementation
3. **Verify algorithm**: Ensure DDA traversal is correct
4. **Edge case coverage**: Test all boundary conditions
5. **Performance**: Verify algorithm efficiency (should be O(n) where n = max dimension)

## Next Steps After Implementation

1. Consider `ColumnVolume.pick()` implementation (sparse-aware DDA)
2. Consider `Volume.pick()` union function (routes to appropriate implementation)
3. Integration with picking plugin (future work)

