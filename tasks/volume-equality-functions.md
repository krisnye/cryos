# Volume Equality Functions Plan

**Status**: 📋 PLANNED  
**Goal**: Implement efficient equality functions for DenseVolume and ColumnVolume to enable round-trip conversion verification and testing.

## Overview

To verify round-trip conversions (`DenseVolume ↔ ColumnVolume`), we need efficient equality functions that compare:
- **DenseVolume.equals()**: Compares type, size, and data buffer values
- **ColumnVolume.equals()**: Compares type, size, tile array, and data buffer values

These functions will use the existing `typedBufferEquals` function for buffer comparison, ensuring efficient and correct equality checks.

---

## TypedBuffer Equality (Already Exists) ✅

The `typedBufferEquals` function already exists and handles:
- Same reference check (fast path)
- Type and capacity comparison
- Schema equality (using `equals` function)
- Element-by-element value comparison

**Status**: No changes needed - this is already efficient and handles all buffer types correctly.

---

## DenseVolume.equals Function

Compare two DenseVolume instances for equality.

**Requirements**:
- Given two identical DenseVolume references, should return true (fast path)
- Given two DenseVolume with same type, size, and data, should return true
- Given two DenseVolume with different sizes, should return false
- Given two DenseVolume with same size but different data, should return false
- Should use `typedBufferEquals` for data comparison
- Should handle Vec3 size comparison correctly

**Implementation**:
```typescript
export const equals = <T>(a: DenseVolume<T>, b: DenseVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!vec3Equals(a.size, b.size)) return false;
    return typedBufferEquals(a.data, b.data);
};
```

**File**: `dense-volume/equals.ts`  
**Test File**: `dense-volume/equals.test.ts`

---

## ColumnVolume.equals Function

Compare two ColumnVolume instances for equality.

**Requirements**:
- Given two identical ColumnVolume references, should return true (fast path)
- Given two ColumnVolume with same type, size, tile, and data, should return true
- Given two ColumnVolume with different sizes, should return false
- Given two ColumnVolume with same size but different tile arrays, should return false
- Given two ColumnVolume with same tile but different data, should return false
- Should use `typedBufferEquals` for data comparison
- Should compare tile arrays efficiently (Uint32Array comparison)

**Implementation**:
```typescript
export const equals = <T>(a: ColumnVolume<T>, b: ColumnVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!vec3Equals(a.size, b.size)) return false;
    if (!uint32ArrayEquals(a.tile, b.tile)) return false;
    return typedBufferEquals(a.data, b.data);
};
```

**File**: `column-volume/equals.ts`  
**Test File**: `column-volume/equals.test.ts`

---

## Vec3 Equality Helper

Compare two Vec3 arrays for equality.

**Requirements**:
- Given two identical Vec3 arrays, should return true
- Given two Vec3 with same values [x, y, z], should return true
- Given two Vec3 with different values, should return false
- Should handle edge cases (zero, negative, large numbers)

**Implementation**:
```typescript
const vec3Equals = (a: Vec3, b: Vec3): boolean => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};
```

**Location**: Can be inline in equals functions or shared helper

---

## Uint32Array Equality Helper

Compare two Uint32Array instances for equality.

**Requirements**:
- Given two identical Uint32Array references, should return true (fast path)
- Given two Uint32Array with same length and values, should return true
- Given two Uint32Array with different lengths, should return false
- Given two Uint32Array with same length but different values, should return false
- Should be efficient (direct memory comparison when possible)

**Implementation**:
```typescript
const uint32ArrayEquals = (a: Uint32Array, b: Uint32Array): boolean => {
    if (a === b) return true; // fast path
    if (a.length !== b.length) return false;
    // Compare element by element (can optimize with DataView if needed)
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};
```

**Location**: Can be inline in equals functions or shared helper

---

## Round-Trip Verification Strategy

Use equality functions to verify round-trip conversions:

**DenseVolume → ColumnVolume → DenseVolume**:
- Convert: `dense1 → column → dense2`
- Verify: `DenseVolume.equals(dense1, dense2)` should be true for non-empty voxels
- Note: Empty voxels may differ if original had non-zero defaults

**ColumnVolume → DenseVolume → ColumnVolume**:
- Convert: `column1 → dense → column2`
- Verify: `ColumnVolume.equals(column1, column2)` should be true
- Note: Should preserve all column structure exactly

---

## Write Unit Tests

### DenseVolume.equals Tests

**Requirements**:
- Given identical references, should return true
- Given volumes with same size and data, should return true
- Given volumes with different sizes, should return false
- Given volumes with same size but different data, should return false
- Given volumes with different types (shouldn't happen but handle), should return false
- Should handle empty volumes correctly
- Should handle fully dense volumes correctly

### ColumnVolume.equals Tests

**Requirements**:
- Given identical references, should return true
- Given volumes with same size, tile, and data, should return true
- Given volumes with different sizes, should return false
- Given volumes with same size but different tile arrays, should return false
- Given volumes with same tile but different data, should return false
- Should handle empty volumes (all EMPTY_COLUMN) correctly
- Should handle fully dense volumes correctly
- Should handle sparse volumes correctly

### Round-Trip Tests

**Requirements**:
- Given DenseVolume → ColumnVolume → DenseVolume, should preserve non-empty voxels
- Given ColumnVolume → DenseVolume → ColumnVolume, should produce equivalent ColumnVolume
- Should handle empty volumes correctly
- Should handle sparse volumes correctly
- Should handle volumes with z-offsets correctly

---

## File Structure

Following the established pattern:

```
cryos/src/types/
  dense-volume/
    equals.ts              # DenseVolume.equals implementation
    equals.test.ts         # DenseVolume.equals tests
    namespace.ts           # Re-export: export * from "./equals.js";
  
  column-volume/
    equals.ts              # ColumnVolume.equals implementation
    equals.test.ts         # ColumnVolume.equals tests
    namespace.ts           # Re-export: export * from "./equals.js";
```

---

## Implementation Order

1. **Implement Vec3 and Uint32Array helpers** (if needed as separate functions)
2. **Write DenseVolume.equals tests** (TDD)
3. **Implement DenseVolume.equals**
4. **Write ColumnVolume.equals tests** (TDD)
5. **Implement ColumnVolume.equals**
6. **Write round-trip verification tests**
7. **Update toDenseVolume tests to use equality functions**

---

## Performance Considerations

- **Fast path checks**: Same reference comparison first
- **Early exits**: Check type and size before expensive buffer comparisons
- **TypedArray optimization**: `typedBufferEquals` already handles TypedArray efficiently
- **Tile array comparison**: Direct element-by-element comparison (can optimize with DataView if needed)

---

## Success Criteria

✅ All unit tests passing  
✅ DenseVolume.equals correctly compares volumes  
✅ ColumnVolume.equals correctly compares volumes  
✅ Round-trip conversions verified using equality functions  
✅ TypeScript compilation successful  
✅ No linting errors  
✅ Follows existing code patterns and conventions

