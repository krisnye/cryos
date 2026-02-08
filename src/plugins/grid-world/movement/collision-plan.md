# Plan: Grid-Based Broad-Phase Collision Detection for Movement

**Status**: IMPLEMENTED  
**Goal**: Add a highly optimized grid-based broad-phase collision detection system for particles with velocity in the movement system.

---

## 1. Verified Architecture Summary

### 1.1 Grid World Layout

| Concept | Implementation |
|---------|----------------|
| **Chunk key** | `getWorldChunkKey(chunkX, chunkY) = chunkX * 10000 + chunkY` |
| **Chunk position** | `[chunkX * chunkSize, chunkY * chunkSize, 0]` (world space) |
| **Chunk AABB** | `min = position`, `max = position + volume.size * blockSize` |
| **Resources** | `worldChunks: Map<number, Entity>`, `worldScale: { chunkSize, blockSize }` |
| **Chunk data** | `position`, `materialVolume` (ColumnVolume\<PhysicalVoxel\>) |

### 1.2 Broad-Phase (Current: pickWorld in grid-world.ts)

**Current (AABB-based)**: Iterates chunks in the line's bounding box.

1. **Line AABB**: `minX/maxX = min/max(line.a[0], line.b[0])`, same for Y
2. **Chunk range**: `minChunkX..maxChunkX`, `minChunkY..maxChunkY`
3. **Iteration**: Nested loop over AABB — **O(chunks in AABB)**
4. **Problem**: For a diagonal line across N×N chunks, AABB = O(N²) chunks visited; path = O(N)

**Example**: Line from (0,0) to (640,640), chunkSize=64. AABB iterates 11×11 = **121 chunks**; path crosses **11 chunks** (each (i,i)).

### 1.3 Narrow-Phase (Volume.pick) — DDA Reference

**Verified**: ColumnVolume.pick and DenseVolume.pick use DDA (Digital Differential Analyzer) voxel traversal.

- **Step size**: Distance along ray to cross one voxel boundary: `stepX = |1/dirX|`, etc.
- **tMaxX, tMaxY, tMaxZ**: Parametric distance to next boundary on each axis
- **Step**: Advance to nearest boundary, increment voxel index, add step to tMax
- **Result**: Visits only voxels the ray actually passes through — **O(voxels in path)**

### 1.4 Chunk DDA (Proposed Broad-Phase)

Same structure as voxel DDA, but chunk boundaries are `chunkSize` apart (fixed regular grid):

- **Chunk grid**: 2D (chunkX, chunkY). Boundaries at `x = k*chunkSize`, `y = k*chunkSize`
- **chunkX** = `floor(a[0]/chunkSize)`, **chunkY** = `floor(a[1]/chunkSize)`
- **stepX** = `chunkSize/|dx|` (distance along ray to cross one chunk in X)
- **stepY** = `chunkSize/|dy|`
- **tMaxX, tMaxY**: Parametric t to next chunk boundary
- **Step**: Advance to nearest X or Y boundary; increment chunkX or chunkY; add step to tMax
- **Result**: **O(chunks in path)** — only chunks the line actually crosses

### 1.5 Narrow-Phase (Volume.pick)

**Verified**: ColumnVolume.pick uses DDA voxel traversal.

- Broad-phase: `Aabb.lineIntersection` on volume bounding box
- Narrow-phase: DDA steps along ray, checks only non-empty columns
- Pickable: `PhysicalVoxel.getMaterialId(voxel) !== Material.ids.air`
- Returns: `{ coordinates, alpha, face }` or null

### 1.6 Collision Model

- **Particles**: Lines with no size (radius = 0)
- **Trajectory**: Line from `position` to `position + velocity * dt`
- **Existing**: `pickWorld(line)` returns full `PickResult`; we need only collision detection (hit + alpha)

---

## 2. Collision Detection Design

### 2.1 Flow (per particle)

```
For each particle (position, velocity):
  1. Build line: a = position, b = position + velocity * dt
  2. Broad-phase (DDA): Step along line, visiting each chunk the line crosses in order
     - chunkX = floor(a[0]/chunkSize), chunkY = floor(a[1]/chunkSize)
     - tMaxX, tMaxY = distance to next chunk boundary
     - Loop: if chunk exists, narrow-phase; else step to next chunk boundary
  3. Narrow-phase: For current chunk, Volume.pick (transform line to model space)
  4. If hit: Clamp position to collision point, zero velocity (or apply bounce later)
  5. Else: Apply velocity to position
```

### 2.2 Integration Point

Collision check happens **before** applying velocity (lines 39–42 in movement.ts):

```ts
// Current: apply unconditionally
position[baseIndex] += velocity[baseIndex] * dt;
// ...
```

Replace with:

```ts
const collisionAlpha = pickWorldCollision(db, line);
if (collisionAlpha !== null) {
    // Hit: clamp to collision point, zero velocity
    const t = Math.max(0, collisionAlpha - 0.0001); // Slight epsilon to avoid tunnel
    position[baseIndex] = line.a[0] + (line.b[0] - line.a[0]) * t;
    position[baseIndex + 1] = line.a[1] + (line.b[1] - line.a[1]) * t;
    position[baseIndex + 2] = line.a[2] + (line.b[2] - line.a[2]) * t;
    velocity[baseIndex] = velocity[baseIndex + 1] = velocity[baseIndex + 2] = 0;
} else {
    position[baseIndex] += velocity[baseIndex] * dt;
    // ...
}
```

### 2.3 Shared Collision API

**Option A**: Reuse `pickWorld` action  
- Pros: No new code, single source of truth  
- Cons: Allocates `PickResult` per particle; movement needs grid-world extended

**Option B**: Extract `pickWorldCollision(line): number | null`  
- Returns only `lineAlpha` (0–1) or null (no hit)  
- Zero allocation for hit case if we return primitive  
- Can live in grid-world or a shared collision module

**Recommendation**: Option B. Add `pickWorldCollision` to grid-world actions (or a `collision` module) that returns `number | null`. Movement calls it. `pickWorld` can internally call `pickWorldCollision` and build `PickResult` when needed, or both share the same core logic.

---

## 3. Implementation Tasks

### Task 1: Implement DDA-Based Chunk Traversal + Collision

**File**: `movement/collision.ts`

**Function**: `pickWorldCollision(db: GridWorldDatabase, line: Line3): number | null`

**Broad-phase (DDA — same pattern as Volume.pick)**:
- Parametric line: `p(t) = a + t*(b-a)`, t ∈ [0,1]
- `chunkX = floor(a[0]/chunkSize)`, `chunkY = floor(a[1]/chunkSize)`
- `dx = b[0]-a[0]`, `dy = b[1]-a[1]`; handle zero-length line (return null)
- `stepX = chunkSize/|dx|`, `stepY = chunkSize/|dy|` (Infinity if dx=0 or dy=0)
- `tMaxX` = t to next X boundary; `tMaxY` = t to next Y boundary
- Loop: while t ≤ 1, check chunk at (chunkX, chunkY); if exists, narrow-phase; if hit, return alpha; else step to next boundary (advance chunkX or chunkY, add step to tMax); exit when t > 1

**Narrow-phase**: Same as pickWorld — transform line to model space, `Volume.pick` with `pickable = not air`

**Return**: `lineAlpha` (0–1) of first hit, or `null` if no hit

**Dependencies**: `GridWorldDatabase` from `../grid-world.js`, `@adobe/data/math` (Line3), `types/volume`, `types/material`, `types/physical-voxel`

**Note**: Accepts `db` so it can read `db.resources.worldChunks`, `db.resources.worldScale`, and `db.get(entity, "position" | "materialVolume")` for entity lookup. Keeps all grid-world logic typed and testable.

### Task 2: Movement Plugin Depends on Grid-World

**File**: `movement/movement.ts`

- Change `extends` to include grid-world: `extends: Database.Plugin.combine(physics, gridWorld)` or equivalent so movement has access to `worldChunks` and `worldScale`
- Alternative: Keep movement independent; require sample to always combine gridWorld + movement. Movement checks for `db.resources.worldChunks` and skips collision if absent (graceful degradation).

**Recommendation**: Movement extends grid-world when collision is needed. For the sample, gridWorld is already combined; movement just needs to read resources. No plugin change needed if we pass worldChunks/worldScale from db.resources (they exist when gridWorld is in the combine).

### Task 3: Integrate Collision into applyVelocity

**File**: `movement/movement.ts`

- Guard: skip collision if `db.resources.worldChunks` is undefined (graceful degradation without grid-world)
- For each particle: build `line`, call `pickWorldCollision(db, line)` (single typed call)
- If hit: set position to collision point (with epsilon), zero velocity
- Else: apply velocity as today

Movement plugin stays thin; collision logic is delegated to `collision.ts`.

### Task 4: Avoid Allocations in Hot Path (Optional)

**Optimizations**:

- Reuse a single `Line3` object per table: `line.a` and `line.b` are mutated each iteration
- Or pass `(ax, ay, az, bx, by, bz)` to avoid line object creation
- `pickWorldCollision` should avoid allocating `PickResult`; return only `number | null`

### Task 5: Tests

- **Unit** (colocated): `collision.test.ts` — `pickWorldCollision` with mocked or real db: line hits terrain, misses, crosses chunk boundary
- **Unit** (optional): `chunk-dda.test.ts` — chunk DDA iterator in isolation (pure, no db)
- **Integration**: Movement + collision — bullet stops at terrain, bullet in air continues

Decomposed functions enable focused tests without exercising the full plugin.

---

## 4. Performance Considerations

| Factor | Approach |
|--------|----------|
| Chunk iteration | **O(chunks in path)** — DDA steps only through chunks the line crosses (same as narrow-phase voxel DDA) |
| Diagonal worst case | AABB: O(N²) chunks. Path: O(N) chunks. |
| Per-particle | One DDA traversal + narrow-phase per chunk visited until first hit |
| Allocation | Return `number \| null`; reuse line object in loop |
| Batch | Future: chunk-centric (for each chunk, find particles whose lines intersect, batch narrow-phase) — out of scope for v1 |

---

## 5. Decomposed Architecture (GridWorldDatabase)

**Purpose**: Extract complex logic into separate, testable functions instead of inlining in the movement plugin scope.

**GridWorldDatabase**: Exported from `grid-world.ts` as `Database.FromPlugin<typeof gridWorld>`. Use as the type for `db` when writing functions that need grid-world resources/actions.

**Pattern**: Write pure or near-pure functions that accept `GridWorldDatabase` (or extracted params) as input. Each function lives in its own file under `movement/` with an adjacent `.test.ts`.

**Example signatures**:
```ts
// movement/collision.ts — accepts db for typed access to resources + entity lookup
export const pickWorldCollision = (db: GridWorldDatabase, line: Line3): number | null => { ... }

// movement/chunk-dda.ts — pure; accepts only what it needs (easier to test)
export const createChunkTraversal = (line: Line3, chunkSize: number) => { ... }
```

**Imports**: Movement modules import `GridWorldDatabase` from `../grid-world.js` (or re-export from grid-world).

---

## 6. File Structure

```
cryos/src/plugins/grid-world/
  ├── grid-world.ts              # Exports gridWorld plugin + GridWorldDatabase type
  └── movement/
      ├── movement.ts            # applyVelocity system — thin orchestration, calls decomposed functions
      ├── collision.ts           # pickWorldCollision(db, line): number | null
      ├── collision.test.ts
      ├── chunk-dda.ts           # (optional) chunkDDA iterator — pure, testable
      ├── chunk-dda.test.ts
      ├── plan.md
      └── collision-plan.md
```

**movement.ts** remains a thin plugin that wires systems; collision logic lives in `collision.ts` and optionally `chunk-dda.ts`, each with its own tests.

---

## 7. pickWorld Refactor (Optional)

Consider refactoring `pickWorld` to use the same DDA-based broad-phase for consistency and performance. Both `pickWorld` and `pickWorldCollision` would share the chunk DDA iterator; `pickWorld` builds full `PickResult` when narrow-phase hits; `pickWorldCollision` returns alpha only.

## 8. Next Steps

1. Implement DDA-based `pickWorldCollision` in `movement/collision.ts` using `GridWorldDatabase`
2. Wire movement system to call it (thin orchestration in movement.ts)
3. Add unit tests for `collision.ts` (and optional `chunk-dda.ts`) individually
4. Manual test: bullets stop at terrain
5. Consider refactoring `pickWorld` to use shared DDA broad-phase
