# Plan: Sorted Transparent Particle Rendering

## Overview
Add sorted transparent particle rendering support. Transparent particles must be rendered back-to-front (sorted by depth from camera) with depth writing disabled to render correctly.

## Current State
- ✅ Opaque particles render correctly (base, scale, rotation, scale-rotation variants)
- ✅ Transparent particles are excluded from opaque rendering
- ✅ `transparent` component is marked on entities with non-opaque materials
- ✅ Camera position and view-projection matrix available in resources

## Requirements

### Functional Requirements
1. Render transparent particles separately from opaque particles
2. Sort transparent particles by depth (distance from camera) - furthest first (back-to-front)
3. Render transparent particles after opaque particles in the render phase
4. Disable depth writing for transparent particles (but still test depth for proper occlusion)
5. Support all four particle variants: base, scale, rotation, scale-rotation

### Technical Requirements
1. Calculate particle depth from camera position in world space
2. Sort particles before rendering (CPU-side sorting for simplicity)
3. Use `depthWriteEnabled: false` in render pipeline for transparent variants
4. Render transparent particles in a separate system scheduled after opaque rendering

## File Organization

### Recommended Structure
```
cryos/src/plugins/particle-rendering/
├── dependencies.ts                    # Shared base dependencies (existing)
├── render-helpers.ts                  # Shared render helpers (existing)
├── shader-common.ts                   # Shared WGSL code (existing)
├── particle-rendering-base.ts         # Opaque base particles (existing)
├── particle-rendering-scale.ts        # Opaque scale particles (existing)
├── particle-rendering-rotation.ts     # Opaque rotation particles (existing)
├── particle-rendering-scale-rotation.ts # Opaque scale+rotation (existing)
├── particle-rendering.ts              # Combined opaque plugin (existing)
│
└── transparent/                       # New subdirectory for transparent variants
    ├── dependencies.ts                # Shared transparent dependencies (reuses base + transparent)
    ├── render-helpers.ts              # Transparent-specific render helpers (creates pipelines with depthWriteEnabled: false)
    ├── sort-particles.ts              # Utility function to sort particles by depth
    ├── particle-rendering-transparent-base.ts
    ├── particle-rendering-transparent-scale.ts
    ├── particle-rendering-transparent-rotation.ts
    ├── particle-rendering-transparent-scale-rotation.ts
    └── index.ts                       # Combined transparent plugin
```

## Implementation Steps

### Phase 1: Create Transparent Rendering Infrastructure

1. **Create `transparent/` subdirectory**
   - Organize all transparent particle rendering code

2. **Create `transparent/dependencies.ts`**
   - Export `particleRenderingTransparentDependencies` that combines:
     - `particleRenderingBaseDependencies` (from parent `dependencies.ts`)
     - Already includes transparent component
   - This ensures transparent rendering has all dependencies

3. **Create `transparent/render-helpers.ts`**
   - Re-export or wrap existing render helpers
   - Add `createTransparentRenderPipeline()` function:
     - Same as `createRenderPipeline()` but with `depthWriteEnabled: false`
     - Keep `depthCompare: 'less-equal'` for depth testing
     - Keep blend settings (already correct for transparency)

4. **Create `transparent/sort-particles.ts`**
   - Export `sortParticlesByDepth()` function:
     - Takes: particle tables, camera position
     - Returns: sorted array of particle indices with depth values
     - Calculate depth as distance from camera: `Vec3.distance(cameraPosition, particlePosition)`
     - Sort in descending order (furthest first, back-to-front)
     - Return structure: `{ sortedIndices: number[], depths: number[] }` or similar

### Phase 2: Create Transparent Rendering Plugins

5. **Create `transparent/particle-rendering-transparent-base.ts`**
   - Similar structure to `particle-rendering-base.ts`
   - Query: `["particle", "position", "material", "transparent"]` with `exclude: ["scale", "rotation"]`
   - Use `createTransparentRenderPipeline()` for pipeline creation
   - Before rendering:
     - Collect all particles from tables
     - Calculate depths using camera position
     - Sort by depth (furthest first)
     - Reorder buffers based on sorted indices (or use indirect rendering)
   - System name: `renderParticlesTransparentBase`
   - Schedule: `{ during: ["render"], after: ["renderParticlesBase", "renderParticlesScale", "renderParticlesRotation", "renderParticlesScaleRotation"] }`

6. **Create `transparent/particle-rendering-transparent-scale.ts`**
   - Query: `["particle", "position", "material", "scale", "transparent"]` with `exclude: ["rotation"]`
   - Similar sorting and rendering logic
   - System name: `renderParticlesTransparentScale`
   - Schedule: same as base

7. **Create `transparent/particle-rendering-transparent-rotation.ts`**
   - Query: `["particle", "position", "material", "rotation", "transparent"]` with `exclude: ["scale"]`
   - System name: `renderParticlesTransparentRotation`
   - Schedule: same as base

8. **Create `transparent/particle-rendering-transparent-scale-rotation.ts`**
   - Query: `["particle", "position", "material", "scale", "rotation", "transparent"]`
   - System name: `renderParticlesTransparentScaleRotation`
   - Schedule: same as base

9. **Create `transparent/index.ts`**
   - Export combined plugin: `particleRenderingTransparent`
   - Combines all four transparent variants using `Database.Plugin.combine()`

### Phase 3: Integrate with Main Plugin

10. **Update `particle-rendering.ts`**
    - Import `particleRenderingTransparent` from `./transparent/index.js`
    - Combine with existing opaque plugins:
      ```typescript
      export const particleRendering = Database.Plugin.combine(
          particleRenderingBase,
          particleRenderingScale,
          particleRenderingRotation,
          particleRenderingScaleRotation,
          particleRenderingTransparent
      );
      ```

### Phase 4: Sorting Implementation Details

11. **Particle Sorting Strategy**
    - Collect entity IDs and positions from all matching archetype tables
    - Calculate depth for each particle: `Vec3.distance(camera.position, particle.position)`
    - Sort particles by depth (descending - furthest first)
    - Create sorted index arrays that map sorted order to original table/row indices
    - When copying to GPU buffers, iterate in sorted order

12. **Alternative: Indirect Rendering (Future Optimization)**
    - Could use GPU indirect rendering with sorted index buffer
    - For now, CPU-side sorting and buffer reordering is simpler
    - Can optimize later if performance becomes an issue

### Phase 5: Testing

13. **Visual Verification**
    - Test with particle sample that includes transparent materials (air, water, ice)
    - Verify transparent particles render behind opaque ones correctly
    - Verify transparent particles render in correct order (back-to-front)
    - Verify no visual artifacts or z-fighting

## Technical Considerations

### Depth Calculation
- Use `Vec3.distance(camera.position, particle.position)` for world-space depth
- This provides correct sorting regardless of camera orientation
- Sort in descending order (furthest particles rendered first)

### Buffer Reordering
- After sorting, reorder particle data when copying to GPU buffers
- Copy positions, materials, scales, rotations in sorted order
- Maintain relative ordering of components per particle

### Performance
- Sorting happens CPU-side each frame (O(n log n))
- For large particle counts, could optimize with:
  - Spatial partitioning
  - GPU-side sorting
  - Temporal coherence (only re-sort when camera moves significantly)
- Start with simple CPU sorting, optimize if needed

### Render Pipeline Differences
- **Opaque**: `depthWriteEnabled: true`, `depthCompare: 'less-equal'`
- **Transparent**: `depthWriteEnabled: false`, `depthCompare: 'less-equal'`
- Both use same blend settings (already configured for alpha blending)

## Dependencies

- `@adobe/data/math` - Vec3.distance, Vec3 operations
- `@adobe/data/ecs` - Database, Plugin, queryArchetypes
- Existing particle-rendering infrastructure
- Camera resource from `scene` plugin

## Success Criteria

✅ Transparent particles render correctly behind opaque particles  
✅ Transparent particles render in back-to-front order  
✅ No visual artifacts or z-fighting  
✅ All four particle variants (base, scale, rotation, scale-rotation) work with transparency  
✅ Performance is acceptable (< 1ms sorting overhead for typical particle counts)  
✅ Code is organized and maintainable  

## Future Enhancements

- GPU-side depth sorting using compute shaders
- Spatial partitioning for efficient culling and sorting
- Temporal coherence for sorting (only re-sort when needed)
- Frustum culling for transparent particles
- LOD system for distant transparent particles

