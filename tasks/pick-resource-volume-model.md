# Pick Resource in VolumeModel

## Goal

Add a pluggable `pick` resource to the `volumeModel` plugin so that:
1. **VolumeModel** provides the default (general) pick: iterate over VolumeModel entities, transform ray to model space, call `Volume.pick`, return closest hit.
2. **Grid-world** overrides with `pickGridWorld` when present (DDA-based, more efficient).
3. Consumers use `db.resources.pick(line)` instead of calling `pickWorld` or `pickGridWorld` directly.
4. **Unified pick result**: Single `PickResult` type used everywhere—no `PickGridWorldResult` split.

No new plugin—extend volumeModel and grid-world only.

---

## Current State

| Location | What | Returns |
|----------|------|---------|
| `grid-world` action `pickWorld` | Bounding-box broad-phase, then Volume.pick | `PickResult \| null` |
| `collision.ts` `pickGridWorld` | DDA broad-phase, then Volume.pick | `PickGridWorldResult \| null` |
| `pick-input.ts` | Calls `db.actions.pickWorld(line)` | — |
| `movement.ts` | Calls `pickGridWorld(db, line)` when `worldChunks` present | — |

**Two result types today:**
- `PickResult`: entity, lineAlpha, worldPosition, modelPosition?, face?
- `PickGridWorldResult`: entity, lineAlpha, worldPosition, modelPosition, face, faceNormal (in collision.ts)

---

## Design

### 0. Unify PickResult (Phase 0)

**Single canonical type** in `types/pick-result.ts`:

```ts
export interface PickResult {
    entity: Entity;
    lineAlpha: number;
    worldPosition: Vec3;      // Exact surface hit (not voxel center)
    modelPosition: Vec3;      // Required
    face: AabbFace;           // Required
    faceNormal: Vec3;         // Required – outward from surface
}
```

**Changes:**
- Remove `PickGridWorldResult` from collision.ts—use `PickResult` everywhere
- Update `pick-result.ts`: make `modelPosition` and `face` required; add `faceNormal`
- Update `pickWorld`: fix `worldPosition` to use exact hit (Line3.interpolate) and include `faceNormal`
- Update `pickGridWorld`: return `PickResult` instead of `PickGridWorldResult`
- Update `VoxelPickResult` if needed: it extends PickResult; with modelPosition/face now required, the `voxel` nested object may be redundant. Option: deprecate or simplify.

### 1. Pick resource type

```ts
type PickFn = (line: Line3) => PickResult | null;
```

Single `PickResult` type—no more split.

### 2. volumeModel plugin changes

**Resources:**
```ts
pick: { default: null as PickFn | null }
```

**System: `setupPick`** (runs once before any pick consumer):
- If `worldChunks` in resources → `pick = (line) => pickGridWorld(db, line)`
- Else → `pick = (line) => pickVolumeModels(db, line)` (general implementation)

**General pick `pickVolumeModels`** (new function, e.g. in `volume-model/pick.ts`):
- Query entities with `[volumeModel, materialVolume, position]` (and optional scale, rotation)
- For each entity: build model line from world line using position, scale, rotation
- Call `Volume.pick(volume, modelLine, pickable)`
- Keep track of closest hit by `lineAlpha`
- Return `PickResult` (include `faceNormal` from `Aabb.Face.getNormal(face)`)

**World→model transform** (position + scale, no rotation first):
```ts
modelLine.a = [(line.a[0]-pos[0])/scale[0], (line.a[1]-pos[1])/scale[1], (line.a[2]-pos[2])/scale[2]]
```
Default scale `[1,1,1]` when component missing. Rotation support can be Phase 2.

### 3. grid-world plugin changes

- Add `setupPick` system that sets `pick = (line) => pickGridWorld(db, line)` when grid-world is present.
- System order: `setupPick` must run before pick-input and movement.
- Optionally: deprecate or simplify `pickWorld` action to `(db, line) => db.resources.pick?.(line) ?? null`.

### 4. Consumer updates

| Consumer | Before | After |
|----------|--------|-------|
| `pick-input.ts` | `(db.actions as any).pickWorld(line)` | `db.resources.pick?.(line) ?? null` |
| `movement.ts` | `pickGridWorld(db, line)` when has grid | `db.resources.pick?.(line) ?? null` |

Movement no longer needs `hasGridWorld` check—the resource is already the right impl.

### 5. Plugin dependency & init order

- **volumeModel** defines `pick` resource (default `null`) and provides `pickVolumeModels` for the general case.
- **grid-world** extends volumeModel and adds `setupPick` to override `pick` when `worldChunks` exists.

Init: `setupPick` runs in a system. When does it run? Option A: `schedule: { during: ["update"], before: ["pickInput", "applyVelocity"] }`. Option B: Run in `create` of the first system that needs it (lazy). Option C: A dedicated "setup" phase that runs once at start.

Recommended: `setupPick` system with `schedule: { during: ["update"], order: -1000 }` or similar to run first. Or `before: ["pickInput"]` if pick-input exists.

---

## Implementation Steps

### Phase 0: Unify PickResult

1. **Update `types/pick-result.ts`**
   - Add `faceNormal: Vec3` (required)
   - Make `modelPosition` and `face` required (remove optional)
   - Add JSDoc for `worldPosition`: "Exact surface hit point (not voxel center)"

2. **Remove `PickGridWorldResult`**
   - In `collision.ts`: delete type, change `pickGridWorld` to return `PickResult`
   - Update all imports

3. **Fix `pickWorld` in grid-world.ts**
   - Use `Line3.interpolate(line, volumePickResult.alpha)` for exact `worldPosition` (not voxel center)
   - Add `faceNormal: Aabb.Face.getNormal(volumePickResult.face)`
   - Return `PickResult` with all required fields (entity, lineAlpha, worldPosition, modelPosition, face, faceNormal)

4. **Update `VoxelPickResult`**
   - If `voxel.coordinates` === `modelPosition` and `voxel.face` === `face`, consider deprecating or simplifying to a type alias

5. **Update consumers**
   - pick-input: already uses entity, worldPosition, modelPosition, face—add faceNormal if needed
   - movement: uses worldPosition, faceNormal—no change after unification

### Phase 1: volumeModel pick resource + general pick

1. **Add `pick` resource to volumeModel**
   - `pick: { default: null as PickFn | null }`

2. **Create `pickVolumeModels(db, line)`**
   - Location: `plugins/volume-model/pick.ts` or inline in volume-model
   - Query VolumeModel archetypes (position, materialVolume, scale?, rotation?)
   - For each: transform line to model space, `Volume.pick`, track closest by alpha
   - Return `PickResult | null` with `faceNormal` from `Aabb.Face.getNormal(face)`

3. **Add `setupPick` system to volumeModel**
   - In `create`: set `db.resources.pick = (line) => pickVolumeModels(db, line)`
   - Schedule: early in update (or before pick consumers)

### Phase 2: grid-world override (pick resource)

4. **Add `setupPick` override in grid-world**
   - When grid-world extends volumeModel, we need grid-world's setup to run and replace `pick`
   - System: `setupPick` checks `worldChunks`, sets `pick = (line) => pickGridWorld(db, line)`
   - Must run after volumeModel's setupPick (or replace it). Plugin order: grid-world extends volumeModel, so grid-world systems run after. If both have `setupPick`, we need one system that does the right thing: if worldChunks → pickGridWorld, else pickVolumeModels.

5. **Single `setupPick`**
   - Only one plugin should own `setupPick`. Put it in grid-world (since it's the one that conditionally overrides). When grid-world is present, it sets pick. When only volumeModel is present, we need volumeModel to set pick. So: volumeModel sets default pick in its setupPick; grid-world's setupPick overrides when worldChunks exists. Order: volumeModel setupPick runs first, grid-world setupPick runs second (if grid-world is in the plugin chain).

### Phase 3: Consumer updates

6. **Update pick-input.ts**
   - Use `db.resources.pick?.(line) ?? null`
   - Remove `(db.actions as any).pickWorld`

7. **Update movement.ts**
   - Use `db.resources.pick?.(line) ?? null`
   - Remove `pickGridWorld` import and `hasGridWorld` check

### Phase 4: Cleanup

8. **pickWorld action**
   - Option A: Keep as `(db, line) => db.resources.pick?.(line) ?? null` for backward compat
   - Option B: Remove if no other callers

---

## Summary: unified PickResult

| Field | Before (PickResult) | Before (PickGridWorldResult) | After (unified PickResult) |
|-------|---------------------|------------------------------|----------------------------|
| entity | ✓ | ✓ | ✓ |
| lineAlpha | ✓ | ✓ | ✓ |
| worldPosition | ✓ (voxel center) | ✓ (exact hit) | ✓ (exact hit) |
| modelPosition | optional | required | required |
| face | optional | required | required |
| faceNormal | — | required | required |

---

## Transform details (general pick)

**Position + uniform scale (no rotation):**
```ts
const scale = db.get(entity, "scale") ?? [1, 1, 1];
modelLine.a = [
  (line.a[0] - pos[0]) / scale[0],
  (line.a[1] - pos[1]) / scale[1],
  (line.a[2] - pos[2]) / scale[2],
];
modelLine.b = [
  (line.b[0] - pos[0]) / scale[0],
  (line.b[1] - pos[1]) / scale[1],
  (line.b[2] - pos[2]) / scale[2],
];
```

**With rotation (Phase 2):** Apply inverse rotation to (line.a - pos) and (line.b - pos) before dividing by scale. Requires Quat utilities.

---

## File structure

```
cryos/src/plugins/
  volume-model.ts           # Add pick resource, setupPick system
  volume-model/
    pick.ts                 # pickVolumeModels(db, line) - NEW
  grid-world/
    grid-world.ts           # Add setupPick override
    movement/
      movement.ts           # Use db.resources.pick
```

---

## Testing

1. **pickVolumeModels** unit tests: single VolumeModel, multiple, none, line miss
2. **setupPick** integration: with/without grid-world, verify correct impl is used
3. **pick-input** and **movement** continue to work in grid-world sample

---

## Risks & considerations

- **Init order**: `setupPick` must run before any system that calls `pick`. Use schedule ordering.
- **Rotation**: General pick may not support rotated volumes initially. Grid-world chunks use axis-aligned scale only.
- **Performance**: General pick is O(n) in VolumeModel count. Grid-world pick is O(chunks crossed). For many scattered volumes, general pick is acceptable; for dense grids, grid-world wins.
