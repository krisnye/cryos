# Source Organization

This folder contains the core source code organized into three main categories:

## `/plugins` - ECS Plugins

**Purpose**: Plugin definitions that compose functionality for the ECS system.

**Structure**:
- Simple plugins: Single file (e.g., `graphics.ts`, `geometry.ts`, `scene.ts`)
- Complex plugins: Own folder with `index.ts` (e.g., `voxel-rendering/`)
  - Use folders when a plugin requires supporting files (shaders, utilities, etc.)
  - Main plugin export in `index.ts`
  - Supporting files in the same folder

**Principles**:
- Each plugin extends or combines other plugins
- Plugins export composable `Database.Plugin` objects
- Keep plugins focused and composable

## `/types` - Type Definitions & Utilities

**Purpose**: TypeScript types, schemas, and reusable utility functions organized by type.

**Structure**:
- Each type has its own folder (e.g., `camera/`, `schema-x/`)
- Types and related utilities are co-located in the same folder
- Utilities exported via namespace matching the type name (e.g., `SchemaX` for schema-related utilities)
- This improves discoverability while maintaining tree-shakeability via namespace exports

**Principles**:
- Namespace exports enable tree-shaking
- Types should be reusable across multiple plugins
- Organize by the primary type the utilities operate on

## `/samples` - Example Applications

**Purpose**: Sample applications and demos that use the plugins.

**Structure**:
- Each sample is self-contained in its own folder
- Samples demonstrate plugin composition and usage

**Principles**:
- Samples show real-world usage patterns
- Samples should be runnable examples
- Keep samples minimal but complete

