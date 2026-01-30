# Types Audit Results

## Standard Pattern

**Simple Types**: Single `<type-name>.ts` file (e.g., `key-code.ts`)

**Complex Types**: Folder following Material pattern:
- `{type-name}.ts` - Exports type and namespace: `export type X = ...; export * as X from "./public.js";`
- `public.ts` - Aggregates from separate files: `export * from "./file1.js"; export * from "./file2.js";`
- **No `index.ts`** - Main `types/index.ts` handles re-exports

## Correct Types ✅

1. **`material/`** - Template pattern, correct
   - `material.ts` exports type and namespace ✓
   - `public.ts` aggregates from separate files ✓
   - No `index.ts` ✓

2. **`rgba/`** - Follows Material pattern
   - `rgba.ts` exports type and namespace ✓
   - `public.ts` aggregates utilities ✓
   - No `index.ts` ✓

3. **`key-code.ts`** - Simple type, single file ✓

4. **`key-state.ts`** - Simple type, single file ✓

5. **`volume.ts`** - Simple type, single file ✓

## Inconsistent Types ❌

### 1. `camera/` - Missing namespace export, has index.ts

**Issues**:
- `camera.ts` doesn't export `export * as Camera from "./public.js";`
- Has `index.ts` (should be removed per Material pattern)

**Current**:
```typescript
// camera/camera.ts
export type Camera = Schema.ToType<typeof schema>;
// Missing: export * as Camera from "./public.js";
```

**Should be**:
```typescript
// camera/camera.ts
export type Camera = Schema.ToType<typeof schema>;
export * as Camera from "./public.js";
```

**Files to fix**:
- `camera/camera.ts` - Add namespace export
- `camera/index.ts` - Remove (not needed)
- `types/index.ts` - Update import from `camera/index.js` to `camera/camera.js`

---

### 2. `column-volume/` - Has index.ts

**Issues**:
- Has `index.ts` (should be removed per Material pattern)
- `column-volume.ts` correctly exports namespace ✓

**Files to fix**:
- `column-volume/index.ts` - Remove (not needed)
- `types/index.ts` - Update import from `column-volume/index.js` to `column-volume/column-volume.js`

---

### 3. `dense-volume/` - Has index.ts

**Issues**:
- Has `index.ts` (should be removed per Material pattern)
- `dense-volume.ts` correctly exports namespace ✓

**Files to fix**:
- `dense-volume/index.ts` - Remove (not needed)
- `types/index.ts` - Update import from `dense-volume/index.js` to `dense-volume/dense-volume.js`

---

### 4. `dense-volume-material/` - Has index.ts and folder, but might be simple

**Issues**:
- Has `index.ts` (should be removed)
- Type is just an alias: `export type DenseVolumeMaterial = DenseVolume<MaterialId>;`
- No utilities, could be simplified to single file

**Current**:
```typescript
// dense-volume-material/dense-volume-material.ts
export type DenseVolumeMaterial = DenseVolume<MaterialId>;
```

**Options**:
- **Option A**: Keep folder but remove `index.ts` (if we expect utilities later)
- **Option B**: Simplify to single `dense-volume-material.ts` file (recommended - it's just a type alias)

**Files to fix**:
- `dense-volume-material/index.ts` - Remove
- `dense-volume-material/dense-volume-material.ts` - Move to `dense-volume-material.ts` (if simplifying)
- `types/index.ts` - Update import accordingly

---

### 5. `schema-x/` - Missing main type file

**Issues**:
- Only has `public.ts` and `index.ts`
- No `schema-x.ts` file that exports type and namespace
- Unclear if this is a type or just utilities

**Current structure**:
```
schema-x/
  create-struct-gpu-buffer.ts
  index.ts
  public.ts
```

**Questions**:
- Is there a `SchemaX` type? If not, should this be moved elsewhere?
- If there is a type, needs `schema-x.ts` following Material pattern

**Files to investigate**:
- Check if `schema-x` exports a type or just utilities
- If type exists, create `schema-x.ts` following Material pattern
- Remove `index.ts` if Material pattern is followed

---

### 6. `vertices/position-color-normal/` - Has index.ts

**Issues**:
- Has `index.ts` (should be removed per Material pattern)
- `position-color-normal.ts` correctly exports namespace ✓

**Files to fix**:
- `vertices/position-color-normal/index.ts` - Remove (not needed)
- `vertices/index.ts` - Update import from `position-color-normal/index.js` to `position-color-normal/position-color-normal.js`
- `types/index.ts` - Update import from `vertices/position-color-normal/index.js` to `vertices/position-color-normal/position-color-normal.js`

---

### 7. `vertices/position-normal-material/` - Has index.ts

**Issues**:
- Has `index.ts` (should be removed per Material pattern)
- `position-normal-material.ts` correctly exports namespace ✓

**Files to fix**:
- `vertices/position-normal-material/index.ts` - Remove (not needed)
- `vertices/index.ts` - Update import from `position-normal-material/index.js` to `position-normal-material/position-normal-material.js`
- `types/index.ts` - Update import from `vertices/position-normal-material/index.js` to `vertices/position-normal-material/position-normal-material.js`

---

## Summary

**Total types audited**: 12
**Correct**: 5 (42%)
**Inconsistent**: 7 (58%)

**Common issues**:
- 6 types have unnecessary `index.ts` files
- 1 type (`camera`) missing namespace export
- 1 type (`schema-x`) missing main type file
- 1 type (`dense-volume-material`) might be simplified to single file

**Impact**:
- All inconsistencies are structural/organizational
- No functional issues expected
- Main `types/index.ts` will need updates for import paths

