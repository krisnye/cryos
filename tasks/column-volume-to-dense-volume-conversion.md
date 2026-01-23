# ColumnVolume to DenseVolume Conversion Plan

**Status**: 📋 PLANNED  
**Goal**: Implement `toDenseVolume()` function to convert ColumnVolume back to DenseVolume, enabling round-trip conversion and compatibility with existing dense volume APIs.

## Overview

The `toDenseVolume()` function is the inverse operation of `ColumnVolume.create()`. It reconstructs a dense volume from a sparse column-based representation by:
1. Creating a dense buffer initialized with default values
2. Iterating through each column and copying voxel data to the correct positions
3. Handling empty columns (filling with defaults)
4. Handling columns with z-offsets (filling gaps with defaults)

This enables:
- Round-trip conversion: `DenseVolume → ColumnVolume → DenseVolume`
- Compatibility with existing dense volume APIs
- Testing and validation of column volume conversions
- Fallback to dense representation when needed

---

## Determine Default Value

Extract the default value from the ColumnVolume's TypedBuffer schema to fill empty voxels.

**Requirements**:
- For TypedArray-backed buffers (number, integer, struct): default is implicitly `0`
- For array buffers: use `schema.default` (must be defined)
- For const buffers: use `schema.const` as default
- Should handle `schema.default === undefined` for array buffers (use `undefined` as default)

**Implementation Notes**:
- Use same logic as `create()` function for consistency
- TypedArray-backed: default is `0`
- Array buffers: check `'default' in schema` and use `schema.default` (can be `undefined`)
- Const buffers: use `schema.const`

---

## Initialize Dense Buffer

Create a TypedBuffer with the same schema as the ColumnVolume, sized to hold all voxels (width × height × depth).

**Requirements**:
- Given ColumnVolume with size [10, 10, 20], should create buffer with capacity 2000
- Should use same schema as ColumnVolume.data
- Should initialize all voxels to default value (TypedArray-backed buffers auto-initialize to 0)
- For array buffers, should explicitly set default values

**Implementation Notes**:
- Use `createTypedBuffer(schema, capacity)` where capacity = width × height × depth
- TypedArray-backed buffers are automatically zero-initialized
- For array buffers, iterate and set default values explicitly

---

## Process Each Column

For each (x,y) position in the tile array, unpack ColumnInfo and copy voxel data to the dense buffer.

**Requirements**:
- Given empty column (EMPTY_COLUMN), should fill entire z-range with default values
- Given column with zStart=0, length=5, should copy 5 voxels starting at z=0
- Given column with zStart=3, length=4, should copy 4 voxels starting at z=3, fill z=0-2 with defaults
- Given column with zStart=2, length=3, ending at z=4, should fill z=5+ with defaults if depth > 5
- Should handle columns that don't span full z-range (fill gaps with defaults)

**Implementation Notes**:
- Iterate through tile array: `for (let y = 0; y < height; y++)` then `for (let x = 0; x < width; x++)`
- Calculate tile index: `x + y * width`
- Check if column is empty: `isEmptyColumn(tile[tileIdx])`
- If empty: fill entire z-range (0 to depth-1) with defaults
- If not empty: unpack ColumnInfo, copy voxels, fill gaps with defaults

---

## Copy Column Voxels

Extract voxels from ColumnVolume.data buffer using the dataOffset and length from ColumnInfo.

**Requirements**:
- Given column with dataOffset=10, length=5, should copy voxels from indices 10-14
- Given column with zStart=3, should place copied voxels at z=3,4,5,6,7 in dense buffer
- Should preserve exact voxel values (no transformation)
- Should handle sequential columns correctly (dataOffset increments)

**Implementation Notes**:
- Use `unpackColumnInfo(tile[tileIdx])` to get `{ dataOffset, length, zStart }`
- Copy voxels: `for (let i = 0; i < length; i++) { denseBuffer.set(denseIndex, columnData.get(dataOffset + i)); }`
- Calculate dense index: `DenseVolumeNamespace.index(denseVolume, x, y, zStart + i)`

---

## Fill Empty Regions

Fill voxel positions not covered by column data with default values.

**Requirements**:
- Given column with zStart=5, length=3, should fill z=0-4 with defaults
- Given column ending at z=7 in volume with depth=10, should fill z=8-9 with defaults
- Given empty column, should fill entire z-range (0 to depth-1) with defaults
- Should use same default value logic as initialization

**Implementation Notes**:
- Before column data: fill z=0 to zStart-1 with defaults
- After column data: fill z=(zStart+length) to depth-1 with defaults
- For empty columns: fill z=0 to depth-1 with defaults
- Use same default value extraction logic as initialization

---

## Handle Default Value Setting

Set default values in the dense buffer for empty regions and gaps.

**Requirements**:
- For TypedArray-backed buffers: no explicit setting needed (already 0)
- For array buffers: explicitly set `schema.default` (or `undefined` if not defined)
- Should handle `undefined` as a valid default value
- Should be efficient (avoid unnecessary operations for TypedArray-backed)

**Implementation Notes**:
- Check buffer type: `buffer.type === "number" || buffer.type === "integer" || buffer.type === "struct"`
- TypedArray-backed: skip explicit setting (already initialized to 0)
- Array buffers: check `'default' in schema` and set `schema.default` (can be `undefined`)

---

## Create DenseVolume Object

Construct and return the DenseVolume with type discriminator, size, and data buffer.

**Requirements**:
- Should return DenseVolume with `type: "dense"`
- Should preserve generic type T from ColumnVolume
- Should use ColumnVolume.size for output size (x, y, z)
- Should return dense buffer with all voxels populated

**Implementation Notes**:
- Return: `{ type: "dense", size: volume.size, data: denseBuffer }`
- Size matches ColumnVolume.size exactly
- All voxels are populated (either from columns or defaults)

---

## Round-Trip Verification

Verify that conversion is lossless for non-empty voxels (default values may differ in representation).

**Requirements**:
- Given DenseVolume → ColumnVolume → DenseVolume, non-empty voxels should match exactly
- Empty voxels should be represented as defaults (may differ if original had non-zero defaults)
- ColumnVolume → DenseVolume → ColumnVolume should produce equivalent ColumnVolume
- Should preserve all non-default voxel values exactly

**Implementation Notes**:
- Test with fully dense volumes (all non-empty)
- Test with sparse volumes (mix of empty and non-empty)
- Test with columns at various z-offsets
- Verify data integrity, not just structure

---

## Write Unit Tests

Create comprehensive test suite covering edge cases: empty volumes, full volumes, sparse volumes, z-offsets, and round-trip conversion.

**Requirements**:
- Given empty ColumnVolume (all EMPTY_COLUMN), should produce DenseVolume with all defaults
- Given fully dense ColumnVolume (all columns populated), should produce DenseVolume with all voxels
- Given sparse ColumnVolume (few columns), should produce DenseVolume with defaults for empty columns
- Given ColumnVolume with columns at z-offsets, should preserve z-positions correctly
- Given ColumnVolume → DenseVolume → ColumnVolume, should produce equivalent ColumnVolume
- Given DenseVolume → ColumnVolume → DenseVolume, should preserve non-empty voxels exactly
- Should handle boundary cases: zStart=0, zStart=max, length=1, length=max

---

## File Structure

Following the pattern established with `create.ts`:

```
cryos/src/types/column-volume/
  to-dense-volume.ts          # Implementation
  to-dense-volume.test.ts     # Tests
  namespace.ts                # Re-export: export * from "./to-dense-volume.js";
```

---

## Implementation Order

1. **Write tests first** (TDD approach)
   - Empty volume test
   - Fully dense volume test
   - Sparse volume test
   - Z-offset test
   - Round-trip test

2. **Implement default value extraction**
   - Helper function to get default value from schema
   - Handle TypedArray vs Array buffer types

3. **Implement buffer initialization**
   - Create dense buffer with correct capacity
   - Initialize with defaults

4. **Implement column processing**
   - Iterate through tile array
   - Handle empty columns
   - Handle columns with data

5. **Implement voxel copying**
   - Extract column data using ColumnInfo
   - Place voxels at correct positions

6. **Implement gap filling**
   - Fill regions before/after column data
   - Fill empty columns

7. **Verify round-trip conversion**
   - Test DenseVolume → ColumnVolume → DenseVolume
   - Test ColumnVolume → DenseVolume → ColumnVolume

---

## Error Cases

- **Invalid ColumnInfo**: Should handle corrupted or invalid ColumnInfo gracefully
- **Out of bounds**: Should handle dataOffset + length exceeding data buffer capacity
- **Schema mismatch**: Should preserve schema from ColumnVolume (no validation needed)

---

## Performance Considerations

- **TypedArray optimization**: Skip explicit default setting for TypedArray-backed buffers
- **Batch operations**: Consider batching default value setting for array buffers
- **Memory efficiency**: DenseVolume will use more memory than ColumnVolume (expected)

---

## Success Criteria

✅ All unit tests passing  
✅ Round-trip conversion preserves non-empty voxels exactly  
✅ Empty regions filled with correct defaults  
✅ Handles all edge cases (empty, full, sparse, z-offsets)  
✅ TypeScript compilation successful  
✅ No linting errors  
✅ Follows existing code patterns and conventions

