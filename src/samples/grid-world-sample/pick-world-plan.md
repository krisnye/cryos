# Plan: Add `pick-world` Action to Grid-World Plugin

## Overview
Add a high-performance `pick-world` action to the `grid-world` plugin that takes a `Line3` (world space) and returns a `PickResult` from terrain chunks.

## Requirements

### Input/Output
- **Input**: `Line3` from `@adobe/data/math` (world space coordinates)
- **Output**: `PickResult | null` (entity, lineAlpha, worldPosition, modelPosition)

### Performance Constraint
**CRITICAL**: Performance is the highest priority. The function must:
- Minimize chunk iterations
- Use fast broad-phase rejection
- Only perform expensive operations on chunks that pass broad-phase
- Avoid unnecessary allocations

## Architecture

### Broad-Phase (Fast Rejection)
1. **Determine candidate chunks**:
   - Extract X,Y from line start/end points
   - Calculate which chunks the line passes through
   - Use `getWorldChunkByPosition` or iterate through `worldChunks` map

2. **Quick AABB intersection test per chunk**:
   - Chunk position: `[chunkX * chunkSize, chunkY * chunkSize, 0]` (world space)
   - Chunk size in model space: `volume.size` (from ColumnVolume)
   - Chunk scale: `blockSize` (default 4)
   - **World-space AABB**:
     - `min`: `[chunkX * chunkSize, chunkY * chunkSize, 0]`
     - `max`: `[chunkX * chunkSize + volume.size[0] * blockSize, chunkY * chunkSize + volume.size[1] * blockSize, volume.size[2] * blockSize]`
   - Use `Aabb.lineIntersection` for fast rejection
   - Only proceed to narrow-phase if `alpha !== -1`

### Narrow-Phase (Actual Picking)
1. **Transform line to chunk model space**:
   - Chunk position: `chunkPosition = [chunkX * chunkSize, chunkY * chunkSize, 0]`
   - Chunk scale: `blockSize`
   - Transform line from world space to model space:
     - `modelLine.a = [(worldLine.a[0] - chunkPosition[0]) / blockSize, (worldLine.a[1] - chunkPosition[1]) / blockSize, worldLine.a[2] / blockSize]`
     - `modelLine.b = [(worldLine.b[0] - chunkPosition[0]) / blockSize, (worldLine.b[1] - chunkPosition[1]) / blockSize, worldLine.b[2] / blockSize]`

2. **Convert ColumnVolume to DenseVolume** (if needed):
   - Use existing `toDenseVolume` function
   - **Performance note**: This is expensive, but necessary since `pick` only works on DenseVolume
   - Consider caching converted volumes if performance becomes an issue

3. **Call existing `pick` function**:
   - Use `DenseVolume.pick(volume, modelLine, pickable)` where `pickable = (voxel) => voxel !== Material.ids.air`
   - Returns: `{ coordinates: Vec3, alpha: number, face: AabbFace } | null`

4. **Transform result back to world space**:
   - If pick result exists:
     - `worldPosition = [chunkPosition[0] + modelCoordinates[0] * blockSize, chunkPosition[1] + modelCoordinates[1] * blockSize, modelCoordinates[2] * blockSize]`
     - `lineAlpha`: Use the alpha from pick result (already in model space, but should be valid for world space line)
     - `modelPosition`: The model-space coordinates from pick result

5. **Return closest pick**:
   - If multiple chunks are intersected, return the one with the smallest `lineAlpha` (closest to line start)

## Implementation Steps

### Step 1: Add `pick-world` action to `grid-world.ts`
- Add action signature: `pickWorld: (db, line: Line3) => PickResult | null`
- Import required types: `Line3`, `PickResult`, `Aabb`, `Material`
- Import `toDenseVolume` from `column-volume`
- Import `pick` from `dense-volume`

### Step 2: Implement broad-phase chunk selection
- Calculate chunks that line might intersect:
  - Get min/max X,Y from line endpoints
  - Calculate chunk indices: `chunkX = Math.floor(x / chunkSize)`, `chunkY = Math.floor(y / chunkSize)`
  - Iterate through all chunks in the bounding box
- For each chunk:
  - Get chunk entity and position
  - Get chunk volume and scale
  - Calculate world-space AABB
  - Use `Aabb.lineIntersection` for fast rejection
  - Store candidate chunks with their intersection alpha

### Step 3: Implement narrow-phase picking
- Sort candidate chunks by intersection alpha (closest first)
- For each candidate chunk:
  - Transform line to model space
  - Convert ColumnVolume to DenseVolume
  - Call `DenseVolume.pick` with `pickable = (voxel) => voxel !== Material.ids.air`
  - If pick found:
    - Transform coordinates to world space
    - Return `PickResult` with entity, lineAlpha, worldPosition, modelPosition
- Return `null` if no picks found

### Step 4: Performance optimizations
- Early exit: Return first valid pick (since chunks are sorted by distance)
- Cache consideration: If performance is still an issue, consider caching DenseVolume conversions
- Minimize allocations: Reuse temporary variables where possible
- Fast path: If line is entirely within one chunk, skip broad-phase iteration

## Code Structure

```typescript
actions: {
    pickWorld: (db, line: Line3): PickResult | null => {
        const { worldChunks, worldScale } = db.resources;
        const { chunkSize, blockSize } = worldScale;
        
        // Broad-phase: Find candidate chunks
        const candidates: Array<{
            entity: Entity;
            position: Vec3;
            volume: ColumnVolume<PhysicalVoxel>;
            intersectionAlpha: number;
        }> = [];
        
        // ... broad-phase logic ...
        
        // Sort by distance (closest first)
        candidates.sort((a, b) => a.intersectionAlpha - b.intersectionAlpha);
        
        // Narrow-phase: Pick from closest chunk first
        for (const candidate of candidates) {
            // Transform line to model space
            // Convert to DenseVolume
            // Call pick function
            // Transform result to world space
            // Return if found
        }
        
        return null;
    }
}
```

## Testing Considerations

1. **Unit tests**:
   - Pick from above terrain (should hit)
   - Pick from below terrain (should miss)
   - Pick through multiple chunks (should return closest)
   - Pick at chunk boundaries
   - Pick with line entirely outside world

2. **Performance tests**:
   - Measure time for picking across many chunks
   - Verify broad-phase rejection is working (most chunks rejected quickly)

## Notes

- Chunks are in model space at `blockSize` scale (default 4)
- Chunks are positioned at `[chunkX * chunkSize, chunkY * chunkSize, 0]` in world space
- ColumnVolume `size[2]` gives max height in model space
- World-space height = `size[2] * blockSize`
- The existing `pick` function is well-tested and works in model space

