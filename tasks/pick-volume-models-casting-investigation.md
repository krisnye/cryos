# Investigation: Casting in volume-model/pick.ts

## Restate

Why does `pickVolumeModels` require multiple `as` casts, and is there a cleaner approach?

## Current Casts (5 total)

| Line | Cast | Purpose |
|------|------|---------|
| 23 | `(table.columns as { scale?: { get: (i: number) => Vec3 } }).scale` | Access optional `scale` column not in query Include |
| 27 | `id.get(i) as Entity` | Narrow id column return type to Entity |
| 28 | `position.get(i) as Vec3 \| undefined` | Narrow position column return type |
| 29 | `materialVolume.get(i)` | No cast (Volume inferred) |
| 59 | `entity: entityId as Entity` | Satisfy PickResult.entity type |

## Root Causes

### 1. ** scale column not in query Include**

`queryArchetypes(["volumeModel", "materialVolume", "position"])` returns archetypes with *at least* those components. The return type is `Pick<C, Include>` — only the requested columns. `scale` is not in Include, so it's not in the type.

At runtime, some archetypes (VolumeModelScale, VolumeModelScaleRotation) *do* have scale. We need optional access. TypeScript cannot express "columns that may include scale when present on this archetype" without a cast or type guard.

### 2. ** Database vs Store: ReadonlyArchetype vs Archetype**

- `db.queryArchetypes` (from `ReadonlyStore` / `ReadonlyCore`) → `ReadonlyArchetype` → `ReadonlyTypedBuffer` columns.
- `db.store.queryArchetypes` (from `Store` / `Core`) → `Archetype` → `TypedBuffer` columns.

`VolumeModelDatabase` is `Database.FromPlugin`; the Database interface does not declare `store`, so consumers use `db.queryArchetypes`. That yields `ReadonlyTypedBuffer`, which has `get(index): T` but not `getTypedArray()`. Other plugins (e.g. movement, material-volume-to-vertex-buffers) use `db.store.queryArchetypes` inside system callbacks and get `TypedBuffer` with `getTypedArray()` — no casts.

### 3. ** Deep plugin chain and type inference**

`volumeModel` extends `geometry` extends `materialVertexBuffers` extends `graphics`. `Database.FromPlugin` merges components from all plugins. The resulting `C` is a large intersection. `Pick<C, Include>` and `ReadonlyTypedBuffer<C[K]>` can collapse to `unknown` or overly broad types when the chain is deep, causing `get()` to return `unknown` or a loose type.

### 4. ** Entity and Vec3**

`RequiredComponents` has `id: Entity` (Entity = number). `Vec3` from schema may resolve to `readonly [number, number, number]`. The casts on `id.get(i)` and `position.get(i)` are compensating for type inference losing precision through the plugin chain.

## Cleaner Options

### Option A: Use `db.store` and a typed system context

**Idea**: Have `pickVolumeModels` receive `db` where `db` has `store` in its type (e.g. `Database.ToSystemDatabase<typeof volumeModel>`), and use `db.store.queryArchetypes` to get `Archetype` with `TypedBuffer` columns.

**Pros**: No casts for `id`/`position`; `getTypedArray()` available for id.  
**Cons**: `VolumeModelDatabase` is `Database.FromPlugin` and does not include `store` in its public type. We'd need a new type or a different parameter type.

### Option B: Define a minimal typed interface for the pick function

**Idea**: Define a narrow interface describing only what `pickVolumeModels` needs:

```ts
interface PickVolumeModelsDbView {
  queryArchetypes(include: readonly ["volumeModel", "materialVolume", "position"]): 
    ReadonlyArray<{
      rowCount: number;
      columns: {
        id: { get(i: number): Entity };
        position: { get(i: number): Vec3 };
        materialVolume: { get(i: number): Volume<PhysicalVoxel> };
        scale?: { get(i: number): Vec3 };
      };
    }>;
}
```

**Pros**: Clear contract; no casts inside the function; `VolumeModelDatabase` satisfies it structurally.  
**Cons**: Duplicates shape; must be kept in sync if schema changes.

### Option C: Use `Table.hasColumn` for scale (type guard)

**Idea**: Use `Table.hasColumn(table, "scale")` before accessing scale. The data package has this type guard.

**Pros**: Type-safe access to scale when present.  
**Cons**: Requires `Table` import; `table` is `ReadonlyArchetype` / `ReadonlyTable`; `Table.hasColumn` expects `Table<Partial<C>>`. Need to verify it works with ReadonlyTable.

### Option D: Query with scale in Include and use exclude

**Idea**: Query two sets: one with scale, one without. E.g. `queryArchetypes(..., { exclude: ["scale"] })` for base, and a separate query for scaled.

**Pros**: No cast for scale.  
**Cons**: Two passes; more branching; exclude filters archetypes that *have* scale, which is the opposite of what we want. The query semantics make this awkward.

### Option E: Accept a small number of targeted casts with documentation

**Idea**: Keep the casts but document why each exists and group them in a helper or small block.

**Pros**: Minimal change; casts are localized and explained.  
**Cons**: Casts remain; less type safety.

## Recommendation

**Short term (Option E + C)**: Use `Table.hasColumn` for scale when available (removes that cast) and add a brief comment block explaining the remaining casts. If `Table.hasColumn` does not work with `ReadonlyTable`, keep the scale cast but document it.

**Medium term (Option B)**: Introduce a `PickVolumeModelsDbView` (or similar) in `src/types` that describes the minimal shape needed. Have `pickVolumeModels` accept that interface. `VolumeModelDatabase` can be passed in without change; the structural typing will eliminate the need for casts. This keeps the dependency on the ECS type machinery minimal and explicit.

**Long term (Option A, if data package evolves)**: If `Database.FromPlugin` or a variant exposes `store` in the type (e.g. `ToSystemDatabase`), consider using that for functions that need full store access. This would align `pickVolumeModels` with how movement and material-volume-to-vertex-buffers work.

## Appendix: Why movement.ts has no casts

Movement uses `db.store.queryArchetypes` because it runs inside a system `create` callback. That callback receives `db` with `store` in scope (from `ToSystemDatabase` internally). The store’s `queryArchetypes` returns `Archetype` with `TypedBuffer` columns, so `getTypedArray()` and `get()` have correct types without casts. `pickVolumeModels` is a standalone function taking `VolumeModelDatabase`, which does not expose `store` in its type, so it uses `db.queryArchetypes` (ReadonlyStore) and gets `ReadonlyTypedBuffer`, which leads to the current casts.
