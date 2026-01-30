# Types Audit Epic

**Status**: ✅ COMPLETED  
**Goal**: Audit all types in `src/types/` and identify inconsistencies with the Material pattern standard

## Overview

To ensure consistency and maintainability, all types in `src/types/` should follow the Material pattern standard: simple types use a single file, complex types use a folder with `{type-name}.ts` + `public.ts` (no `index.ts`). This audit identifies all types that don't conform to this standard so they can be refactored.

---

## Audit All Types

Review each type in `src/types/` against the Material pattern standard and document inconsistencies.

**Requirements**:
- Given a type in `src/types/`, should identify if it's simple (single file) or complex (folder with utilities)
- Given a complex type folder, should verify it has `{type-name}.ts` exporting both type and namespace
- Given a complex type folder, should verify it has `public.ts` aggregating from separate files
- Given a complex type folder, should flag if it has an `index.ts` file (should be removed)
- Given a simple type, should verify it's a single file without a folder
- Should document all inconsistencies found with specific file paths and issues

---

## Fix Camera Type

Fix `camera/camera.ts` to export namespace and remove `camera/index.ts`.

**Requirements**:
- Given `camera/camera.ts`, should export `export * as Camera from "./public.js";`
- Given `camera/index.ts`, should be removed (not needed per Material pattern)
- Given `types/index.ts`, should update to import from `camera/camera.js` instead of `camera/index.js`

---

## Fix ColumnVolume Type

Remove `column-volume/index.ts` and update main index.

**Requirements**:
- Given `column-volume/index.ts`, should be removed (not needed per Material pattern)
- Given `types/index.ts`, should update to import from `column-volume/column-volume.js` instead of `column-volume/index.js`

---

## Fix DenseVolume Type

Remove `dense-volume/index.ts` and update main index.

**Requirements**:
- Given `dense-volume/index.ts`, should be removed (not needed per Material pattern)
- Given `types/index.ts`, should update to import from `dense-volume/dense-volume.js` instead of `dense-volume/index.js`

---

## Fix DenseVolumeMaterial Type

Simplify `dense-volume-material/` to a single file since it's just a type alias.

**Requirements**:
- Given `dense-volume-material/` folder, should be replaced with single `dense-volume-material.ts` file
- Given the new single file, should export the type alias directly
- Given `types/index.ts`, should update to import from `dense-volume-material.ts` instead of `dense-volume-material/index.js`

---

## Fix SchemaX Type

Create `schema-x/schema-x.ts` file following Material pattern or determine if it should be a simple type.

**Requirements**:
- Given `schema-x/` folder, should determine if it needs a main type file or if utilities-only is acceptable
- Given it needs a type, should create `schema-x.ts` exporting type and namespace
- Given `schema-x/index.ts`, should be removed if Material pattern is followed
- Given `types/index.ts`, should update imports accordingly

---

## Fix PositionColorNormalVertex Type

Remove `vertices/position-color-normal/index.ts` and update main index.

**Requirements**:
- Given `vertices/position-color-normal/index.ts`, should be removed (not needed per Material pattern)
- Given `vertices/index.ts`, should update to import from `position-color-normal/position-color-normal.js` instead of `position-color-normal/index.js`
- Given `types/index.ts`, should update to import from `vertices/position-color-normal/position-color-normal.js` instead of `vertices/position-color-normal/index.js`

---

## Fix PositionNormalMaterialVertex Type

Remove `vertices/position-normal-material/index.ts` and update main index.

**Requirements**:
- Given `vertices/position-normal-material/index.ts`, should be removed (not needed per Material pattern)
- Given `vertices/index.ts`, should update to import from `position-normal-material/position-normal-material.js` instead of `position-normal-material/index.js`
- Given `types/index.ts`, should update to import from `vertices/position-normal-material/position-normal-material.js` instead of `vertices/position-normal-material/index.js`

