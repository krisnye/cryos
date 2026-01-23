# DenseVolume to ColumnVolume Conversion Epic

**Status**: 📋 PLANNED  
**Goal**: Implement conversion from DenseVolume to ColumnVolume to enable sparse storage for volumes with many empty regions

## Overview

To enable memory-efficient sparse volume storage, we need to convert dense voxel arrays into column-based sparse representation. This conversion identifies empty regions (using schema default values) and stores only non-empty columns, where each column can have variable height and start at any z position. This is essential for terrain and structures with varying ground levels and sparse air space.

---

## Validate Schema Default Value

Check that the input DenseVolume's TypedBuffer schema has a `default` property defined. If not, throw a descriptive error explaining that a default value is required to identify empty voxels.

**Requirements**:
- Given a DenseVolume with schema.default defined, should proceed with conversion
- Given a DenseVolume without schema.default, should throw error with clear message about missing default value
- Given a DenseVolume with schema.default === undefined, should throw error

---

## Process Each Column

For each (x,y) position in the dense volume, scan the z-axis to find the column's bounds (first and last non-empty voxels). Track z start offset and length for each column.

**Requirements**:
- Given a column with all empty voxels, should mark column as empty (skip in output)
- Given a column with non-empty voxels starting at z=5 and ending at z=12, should record z start=5 and length=8
- Given a column with non-empty voxels at z=0,1,2, should record z start=0 and length=3
- Given a column with gaps (empty voxels between non-empty), should include all voxels from first to last non-empty

---

## Build Column Data Buffer

Sequentially append non-empty column voxels to the output data buffer. Track the data offset for each column to pack into ColumnInfo.

**Requirements**:
- Given multiple columns with voxels, should append all voxels sequentially to data buffer
- Given column at (0,0) with 5 voxels and column at (1,0) with 3 voxels, should have data offsets 0 and 5 respectively
- Given empty columns, should not allocate any data buffer space for them
- Given columns with same voxel values, should copy actual values (no deduplication)

---

## Pack ColumnInfo Metadata

For each non-empty column, pack the data offset, length, and z start offset into a single u32 value using bit manipulation.

**Requirements**:
- Given data offset=100, length=15, z start=5, should pack as (100 << 16) | (15 << 8) | 5
- Given data offset=0, length=255, z start=0, should pack correctly at boundaries
- Given data offset > 65535, should handle gracefully (error or truncate with validation)
- Given length > 255, should handle gracefully (error or truncate with validation)
- Given z start > 255, should handle gracefully (error or truncate with validation)

---

## Build Tile Array

Create Uint32Array of size (width * height) and populate with ColumnInfo values. Empty columns should have a sentinel value (e.g., 0xFFFFFFFF or 0) to indicate no data.

**Requirements**:
- Given volume size [16, 16, 32], should create tile array of length 256
- Given column at (x,y), should store ColumnInfo at index x + (y * width)
- Given empty column, should store sentinel value indicating no data
- Given all columns empty, should have all sentinel values in tile array

---

## Calculate Output Size

Determine the output volume size: x and y match input, z is the maximum of (z start + length) across all columns.

**Requirements**:
- Given columns with max z at 20, should set output size z to 20
- Given all empty columns, should set output size z to 0
- Given columns with varying heights, should use maximum (z start + length)
- Given input size [10, 10, 50] but max column ends at z=25, should set output size z to 25

---

## Create ColumnVolume Object

Construct and return the ColumnVolume object with type discriminator, size, tile array, and data buffer.

**Requirements**:
- Given valid conversion data, should return ColumnVolume with type: "column"
- Given input DenseVolume, should preserve the generic type T in output
- Given empty volume (all voxels empty), should return ColumnVolume with empty data buffer and all sentinel tile values
- Given non-empty volume, should return ColumnVolume with non-empty data buffer

---

## Add Helper Functions for ColumnInfo

Create utility functions to pack/unpack ColumnInfo values for readability and maintainability.

**Requirements**:
- Given data offset, length, z start, should pack into ColumnInfo u32
- Given ColumnInfo u32, should unpack into { dataOffset, length, zStart }
- Given sentinel value, should identify as empty column
- Given ColumnInfo, should validate ranges (dataOffset < 65536, length < 256, zStart < 256)

---

## Write Unit Tests

Create comprehensive test suite covering edge cases: empty volumes, full volumes, sparse volumes, boundary conditions, and error cases.

**Requirements**:
- Given empty dense volume (all default values), should produce column volume with no data
- Given fully dense volume (no empty voxels), should produce column volume with all columns
- Given sparse volume (few columns with data), should produce column volume with only those columns
- Given volume with schema.default undefined, should throw error
- Given volume with columns at various z positions, should preserve z offsets correctly
- Given volume with maximum values (offset=65535, length=255, zStart=255), should handle correctly

