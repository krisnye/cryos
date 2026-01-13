# Transparent Plugin Implementation Plan

## Overview
Create a new optional plugin called "transparent" that automatically tags entities with non-opaque materials.

## Requirements

1. **Plugin Structure**
   - Create new file: `cryos/src/plugins/transparent.ts`
   - Define a tag component `transparent: True.schema`
   - Extend from `materials` plugin (requires material component)

2. **System: `markTransparentMaterials`**
   - **Cache optimization**: Maintain a cached `Array<boolean>` lookup table indexed by material index
     - Cache is built/updated in system closure: `let materialTransparentCache: boolean[] | null = null;`
     - On first run or if `Material.materials.length` changes, rebuild cache:
       - Initialize array: `materialTransparentCache = new Array(Material.materials.length)`
       - For each material index: `materialTransparentCache[i] = Material.materials[i].baseColor[3] < 1.0`
     - This enables O(1) lookup instead of material array access per entity
   - Queries archetypes that have `"material"` component but do NOT have `"transparent"` component
   - For each entity:
     - Get the material index from the entity's material column
     - Check cached lookup: `materialTransparentCache[materialIndex]`
     - If true (transparent), add the `transparent` component using `db.store.update(entityId, { transparent: true })`
   - Schedule system to run during `"update"` phase each frame

3. **Export**
   - Export the plugin from `cryos/src/plugins/index.ts`

## Implementation Details

### Component Definition
- Component name: `transparent`
- Schema: `True.schema` (tag component, no value needed)

### Query Pattern
- Use: `db.store.queryArchetypes(["material"], { exclude: ["transparent"] })`
- This finds all entities with material but without the transparent tag

### Material Alpha Check
- Access material via: `Material.materials[materialIndex]`
- Material baseColor is a Vec4: `[r, g, b, a]`
- Check: `material.baseColor[3] < 1.0` (4th element is alpha)

### Adding Component
- Use: `db.store.update(entityId, { transparent: true })`
- This will automatically move the entity to a new archetype that includes the transparent component

### System Schedule
- Schedule: `{ during: ["update"] }`
- Runs each frame to mark newly created entities with transparent materials

## Files to Create/Modify

1. **Create**: `cryos/src/plugins/transparent.ts`
   - Define plugin with transparent component
   - Define system to mark transparent materials
   - Extend from materials plugin

2. **Modify**: `cryos/src/plugins/index.ts`
   - Add export: `export * from "./transparent.js";`

## Testing Considerations

- Verify that entities with alpha < 1.0 materials get the transparent tag
- Verify that entities with alpha = 1.0 materials do NOT get the transparent tag
- Verify that entities that already have the transparent tag are not re-processed (excluded by query)
- Test with existing materials like "water" (alpha 0.1) and "ice" (alpha 0.5)
- Test with fully opaque materials like "rock" (alpha 1.0)

