# Dense Volume Type Renaming Epic

**Status**: 📋 PLANNED  
**Goal**: Rename volume types to dense-volume to prepare for future volume type variants (sparse, octree, etc.)

## Overview

To support multiple volume representations (dense, sparse, octree-based), we need to rename the current `Volume<T>` type to `DenseVolume<T>` and add a discriminator property. This establishes a clear naming convention that distinguishes dense voxel arrays from future volume types, enabling type-safe discrimination and better code organization.

---

## Rename Volume Type to DenseVolume

Rename the generic `Volume<T>` type to `DenseVolume<T>` and add `type: "dense"` discriminator property. Update the type definition, namespace functions, and all type references throughout the codebase.

**Requirements**:
- Given a `Volume<T>` type definition, should rename to `DenseVolume<T>` with `type: "dense"` property
- Given namespace functions that accept `Volume<T>`, should accept `DenseVolume<T>` instead
- Given all imports of `Volume` type, should import `DenseVolume` instead
- Given all type annotations using `Volume<T>`, should use `DenseVolume<T>` instead

---

## Rename Volume Directory Structure

Rename the `types/volume/` directory to `types/dense-volume/` and update all file paths, imports, and exports accordingly.

**Requirements**:
- Given directory `types/volume/`, should be renamed to `types/dense-volume/`
- Given imports from `"../types/volume/volume.js"`, should import from `"../types/dense-volume/dense-volume.js"`
- Given exports from `types/index.ts` referencing volume, should reference dense-volume
- Given namespace exports `Volume.*`, should export as `DenseVolume.*`

---

## Rename VolumeMaterial to DenseVolumeMaterial

Rename the `VolumeMaterial` type alias to `DenseVolumeMaterial` and update the directory structure from `types/volume-material/` to `types/dense-volume-material/`.

**Requirements**:
- Given type alias `VolumeMaterial`, should rename to `DenseVolumeMaterial`
- Given directory `types/volume-material/`, should be renamed to `types/dense-volume-material/`
- Given all imports of `VolumeMaterial`, should import `DenseVolumeMaterial` instead
- Given all type annotations using `VolumeMaterial`, should use `DenseVolumeMaterial` instead

---

## Update Component and Plugin Definitions

Update plugin definitions, component schemas, and transaction signatures to use the new `DenseVolume` and `DenseVolumeMaterial` types.

**Requirements**:
- Given component `materialVolume: Volume<MaterialId>`, should use `DenseVolume<MaterialId>`
- Given transaction parameters using `Volume<MaterialId>`, should use `DenseVolume<MaterialId>`
- Given archetype definitions referencing volume types, should reference dense-volume types
- Given plugin documentation mentioning `Volume<MaterialId>`, should mention `DenseVolume<MaterialId>`

---

## Update Sample Code and Tests

Update all sample code, test files, and helper functions to use the new type names and import paths.

**Requirements**:
- Given sample functions creating volumes, should use `DenseVolume<MaterialId>` type
- Given test files importing volume types, should import dense-volume types
- Given test assertions checking volume types, should check dense-volume types
- Given helper functions accepting `Volume<T>`, should accept `DenseVolume<T>`

---

## Update Documentation and Comments

Update all documentation files, comments, and markdown files that reference the old volume type names.

**Requirements**:
- Given documentation files mentioning `Volume<T>`, should mention `DenseVolume<T>`
- Given code comments referencing volume types, should reference dense-volume types
- Given task files describing volume architecture, should use dense-volume terminology
- Given plan.md references to volume types, should reference dense-volume types

