# ColumnVolume.toDenseVolume Implementation Plan with Equality Verification

**Status**: 📋 PLANNED  
**Epic**: Implement `toDenseVolume()` with round-trip verification using equality functions

## Phase 1: Equality Functions (Prerequisites)

### 1.1 DenseVolume.equals
- **File**: `dense-volume/equals.ts`
- **Tests**: `dense-volume/equals.test.ts`
- **Functionality**: Compare type, size (Vec3), and data buffer
- **Uses**: `typedBufferEquals` for data comparison

### 1.2 ColumnVolume.equals
- **File**: `column-volume/equals.ts`
- **Tests**: `column-volume/equals.test.ts`
- **Functionality**: Compare type, size (Vec3), tile array (Uint32Array), and data buffer
- **Uses**: `typedBufferEquals` for data comparison, direct comparison for tile array

### 1.3 Helper Functions
- Vec3 equality: `a[0] === b[0] && a[1] === b[1] && a[2] === b[2]`
- Uint32Array equality: Element-by-element comparison

**Success Criteria**: All equality tests passing, ready for round-trip verification

---

## Phase 2: toDenseVolume Implementation

### 2.1 Default Value Extraction
- Extract default from schema (same logic as `create()`)
- TypedArray-backed: default is `0`
- Array buffers: use `schema.default` (can be `undefined`)

### 2.2 Buffer Initialization
- Create TypedBuffer with schema and capacity (width × height × depth)
- Initialize with defaults (TypedArray auto-initializes)

### 2.3 Column Processing
- Iterate through tile array (x, y positions)
- Handle empty columns: fill entire z-range with defaults
- Handle columns with data: unpack ColumnInfo, copy voxels, fill gaps

### 2.4 Voxel Copying
- Extract voxels using `dataOffset` and `length`
- Place at correct positions using `zStart` offset

### 2.5 Gap Filling
- Fill regions before/after column data with defaults
- Fill empty columns entirely

**Success Criteria**: All toDenseVolume tests passing

---

## Phase 3: Round-Trip Verification

### 3.1 DenseVolume → ColumnVolume → DenseVolume
- Convert: `dense1 → column → dense2`
- Verify: `DenseVolume.equals(dense1, dense2)` should be true
- Test cases: empty, full, sparse volumes

### 3.2 ColumnVolume → DenseVolume → ColumnVolume
- Convert: `column1 → dense → column2`
- Verify: `ColumnVolume.equals(column1, column2)` should be true
- Test cases: empty, full, sparse, z-offset volumes

**Success Criteria**: All round-trip tests passing

---

## Implementation Order (TDD)

1. **Phase 1.1**: Write DenseVolume.equals tests → Implement → Verify
2. **Phase 1.2**: Write ColumnVolume.equals tests → Implement → Verify
3. **Phase 2**: Write toDenseVolume tests → Implement → Verify
4. **Phase 3**: Write round-trip tests → Verify all conversions

---

## File Structure

```
cryos/src/types/
  dense-volume/
    equals.ts              # DenseVolume.equals
    equals.test.ts         # Tests
    public.ts           # Re-export
  
  column-volume/
    equals.ts              # ColumnVolume.equals
    equals.test.ts         # Tests
    to-dense-volume.ts     # toDenseVolume implementation
    to-dense-volume.test.ts # Tests (includes round-trip)
    public.ts           # Re-export both
```

---

## Success Criteria

✅ All equality function tests passing  
✅ All toDenseVolume tests passing  
✅ Round-trip conversions verified with equality functions  
✅ TypeScript compilation successful  
✅ No linting errors  
✅ Follows existing code patterns

