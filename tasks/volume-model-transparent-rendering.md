# Volume Model Transparent Rendering Epic

**Status**: 📋 PLANNED  
**Goal**: Add transparent rendering support for volume models with proper depth sorting and separate render passes, following the particle rendering pattern.

## Overview

Volume models currently render all materials together, but transparent materials (glass, etc.) need special handling:
- Must be rendered after opaque objects
- Must be sorted back-to-front (furthest first) for correct blending
- Must use different render pipeline (blending enabled, depth write disabled)
- Must maintain instanced rendering efficiency

This epic adds transparent rendering support while preserving the existing efficient caching and instancing system.

---

## Phase 1: Mark Transparent Volume Models

Extend the existing `transparent` plugin to mark volume model entities that contain transparent materials.

**CRITICAL CONSTRAINT**: Only add `transparent` component if the volume has BOTH:
1. Transparent materials (materials with `alpha < 1.0`)
2. Visible faces (actual geometry to render)

**Requirements**:
- Given a volume model entity with materialVolume, should check if volume contains any transparent materials
- Given a volume with transparent materials AND visible faces, should mark entity with `transparent: true` component
- Should NOT add `transparent` component if volume is empty or has no visible faces
- Should cache material transparency lookup for performance
- Should efficiently determine if volume contains transparent voxels with visible faces

**Implementation Approach**:
- Extend `markTransparentMaterials` system or create new system specifically for volume models
- Query entities with `volumeModel` and `materialVolume` components
- Check BOTH conditions:
  1. Volume contains at least one voxel with transparent material (`alpha < 1.0`)
  2. Volume has visible faces (check `volumeModelVertexData` exists and has `capacity > 0`)
- Only add `transparent` component if both conditions are true
- Could optimize by:
  - Caching which materials are transparent (already done in `transparent` plugin)
  - Caching which volumes contain transparent materials (cache by volume identity)
  - Only re-check when volume identity changes
  - Leverage existing `volumeModelVertexData` to determine if volume has visible faces

**Files to Modify**:
- `cryos/src/plugins/transparent.ts` - Add volume model transparency detection
- OR create new system in `volume-model-rendering` plugin that extends `transparent`

---

## Phase 2: Create Transparent Rendering System Structure

Create separate rendering system for transparent volume models, following the pattern from particle rendering.

**Requirements**:
- Given entities with `volumeModel`, `modelVertexBuffer`, and `transparent` components, should render them separately
- Should maintain grouping by vertex buffer (model type) for instancing efficiency
- Should render after opaque volume models
- Should use different render pipeline with blending and depth write disabled

**Implementation Approach**:
- Create `renderVolumeModelsTransparent` system in new file `render-volume-models-transparent.ts`
- Extend `renderVolumeModels` plugin (or create new plugin that extends it)
- Similar structure to `renderVolumeModels` but:
  - Only queries entities with `transparent` component
  - Uses transparent render pipeline (blending enabled, `depthWriteEnabled: false`)
  - Schedules after opaque rendering

**Files to Create**:
- `cryos/src/plugins/volume-model-rendering/render-volume-models-transparent.ts`

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/index.ts` - Combine transparent rendering plugin

---

## Phase 3: Implement Depth Sorting for Transparent Instances

Sort transparent volume model instances by distance from camera before rendering.

**Requirements**:
- Given transparent volume model instances, should sort by depth from camera (furthest first)
- Should sort within each vertex buffer group (maintain instancing efficiency)
- Should handle instances with scale and rotation (calculate center/bounds correctly)
- Should reuse sorting logic from particle rendering where possible

**Implementation Approach**:
- Create sorting utility function similar to `sortIndicesByDepth` from particle rendering
- For each vertex buffer group:
  - Collect instance transforms (position, scale, rotation)
  - Calculate world-space center/bounds for each instance
  - Compute distance from camera to instance center
  - Sort instance data by depth (descending: furthest first)
  - Reorder instance data buffer before GPU upload
- Alternative: Use indirect indexing (like particles) with sorted index buffer

**Challenges**:
- Volume models have complex geometry (not just point particles)
- Need to determine representative point for sorting (center of volume in world space)
- With scale and rotation, center calculation needs to account for transform
- Maintain grouping efficiency while sorting

**Files to Create**:
- `cryos/src/plugins/volume-model-rendering/sort-volume-model-instances.ts` - Sorting utilities

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/render-volume-models-transparent.ts` - Use sorting before rendering

---

## Phase 4: Create Transparent PBR Shader

Create or modify shader for transparent rendering with proper blending.

**Requirements**:
- Should use same vertex shader as opaque (instanced PBR)
- Fragment shader should output color with alpha for blending
- Should discard fully transparent fragments (`alpha <= 0.0`)
- Should work with existing material system

**Implementation Approach**:
- Can reuse `instanced-pbr.wgsl.ts` shader (already handles alpha)
- Only difference is render pipeline configuration:
  - `depthWriteEnabled: false`
  - Blending enabled: `src-alpha`, `one-minus-src-alpha`
  - `depthCompare: 'less-equal'` (still test depth, just don't write)

**Files to Check**:
- `cryos/src/plugins/volume-model-rendering/instanced-pbr.wgsl.ts` - Verify alpha handling

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/render-volume-models-transparent.ts` - Configure transparent pipeline

---

## Phase 5: Separate Render Passes

Ensure transparent rendering happens after opaque rendering in the render schedule.

**Requirements**:
- Opaque volume models should render first (during `["render"]`)
- Transparent volume models should render after opaque (during `["render"]` but later in order)
- Should maintain existing render order with other systems (scene, particles, etc.)

**Implementation Approach**:
- Keep `renderVolumeModels` system scheduled during `["render"]`
- Schedule `renderVolumeModelsTransparent` also during `["render"]` but after opaque
- Use plugin combination order to ensure proper execution order
- OR use explicit scheduling: `{ after: ["renderVolumeModels"] }`

**Files to Modify**:
- `cryos/src/plugins/volume-model-rendering/render-volume-models-transparent.ts` - Schedule configuration
- `cryos/src/plugins/volume-model-rendering/index.ts` - Plugin combination order

---

## Implementation Details

### Instance Sorting Strategy

**Option A: Reorder Instance Data Buffer** (Recommended for simplicity)
- Sort instance transforms within each group
- Reorder instance data buffer before GPU upload
- Simple, maintains current instancing structure
- Cost: CPU sort per frame (similar to particles)

**Option B: Indirect Indexing** (More complex, potentially more efficient)
- Use sorted index buffer (like particles)
- Shader uses indirect indexing via sorted indices
- More complex shader, but could be more efficient for many instances
- Cost: More complex implementation, extra GPU buffer

**Recommendation**: Start with Option A (reorder buffer), similar to current particle rendering pattern.

### Volume Transparency Detection

**Strategy**: Check if volume contains any transparent materials AND has visible faces
- First check: Does `volumeModelVertexData` exist and have `capacity > 0`? (indicates visible faces)
- Second check: Does volume contain any voxels with transparent materials?
- Only add `transparent` component if both conditions are true
- Cache transparency detection by volume identity (if volume doesn't change, no need to re-check)
- Could also check during vertex data generation by tracking which faces use transparent materials

**Implementation Note**: 
- `materialVolumeToVertexData` already only generates vertices for visible faces
- If it returns empty buffer (`capacity === 0`), there's nothing to render
- Should check `volumeModelVertexData.capacity > 0` before adding `transparent` component

### Sorting Point Selection

For instances with transforms:
- **Simple**: Use instance position as sort point (center of volume at origin)
- **Better**: Account for scale - use center of bounding box in world space
- **Best**: Account for rotation - use center of transformed bounding box

**Recommendation**: Start with simple (position only), then enhance if needed.

---

## Component Addition Constraints

**CRITICAL PRINCIPLE**: Components should ONLY be added to entities when there is something relevant to render.

### Current Implementation Status

✅ **Already Correct**:
- `materialVolumeToVertexData` only generates vertices if `faceCount > 0` (returns empty buffer with `capacity === 0` otherwise)
- Rendering systems query for `modelVertexBuffer` component (entities without it are automatically skipped)

⚠️ **Needs Verification/Enhancement**:
- `generateVertexData`: Currently adds `volumeModelVertexData` even if empty (`capacity === 0`). Should check `vertexData.capacity > 0` before adding component.
- `createVertexBuffers`: Should verify `vertexData.capacity > 0` before adding `modelVertexBuffer` component (currently assumes it exists)
- `markTransparentMaterials` (for volumes): Should verify `volumeModelVertexData` exists AND has `capacity > 0` before adding `transparent` component

### Component Addition Rules

1. **`volumeModelVertexData`**: 
   - Only add if `materialVolumeToVertexData` returned buffer with `capacity > 0`
   - If `capacity === 0`, volume has no visible faces → don't add component

2. **`modelVertexBuffer`**: 
   - Only add if `volumeModelVertexData` exists AND has `capacity > 0`
   - No need to create GPU buffer for empty vertex data

3. **`transparent`** (for volume models): 
   - Only add if BOTH:
     - `volumeModelVertexData` exists and has `capacity > 0` (has visible faces to render)
     - AND volume contains at least one voxel with transparent material (`alpha < 1.0`)
   - Don't add if volume is empty or has no visible faces

### Why This Matters

- **Component Bloat Reduction**: Entities without renderable geometry don't get rendering components
- **Query Performance**: Fewer entities in rendering archetypes = faster queries
- **Memory Efficiency**: No unnecessary GPU buffers for empty volumes
- **Accuracy**: Transparency detection only marks entities that actually have transparent geometry to render
- **Data-Oriented Design**: Components represent actual state/data, not potential state

### Implementation Strategy

For transparent rendering:
- Check `volumeModelVertexData` component exists (indicates `generateVertexData` found visible faces)
- Check `volumeModelVertexData.capacity > 0` (double-check it's not empty)
- Then check if volume contains transparent materials
- Only then add `transparent` component

This ensures the `transparent` component is a reliable indicator that:
1. The entity has renderable geometry (visible faces)
2. AND that geometry includes transparent materials

---

## Testing Requirements

1. **Visual Testing**:
   - Given a volume model with transparent materials (glass), should render correctly
   - Given transparent volume behind opaque volume, should show through
   - Given multiple transparent volumes, should blend correctly

2. **Performance Testing**:
   - Verify sorting doesn't cause performance issues
   - Verify transparent rendering maintains instancing efficiency
   - Verify caching of transparency detection works

3. **Edge Cases**:
   - Volumes with mixed opaque/transparent materials
   - Very large numbers of transparent instances
   - Instances with extreme scales/rotations

---

## File Structure

```
cryos/src/plugins/volume-model-rendering/
  volume-model-rendering-data.ts          ✅ (existing)
  generate-vertex-data.ts                 ✅ (existing)
  create-vertex-buffers.ts                ✅ (existing)
  render-volume-models.ts                 ✅ (existing)
  render-volume-models-transparent.ts     ⬜ (new)
  sort-volume-model-instances.ts          ⬜ (new - optional, could inline)
  instanced-pbr.wgsl.ts                   ✅ (existing, may need verification)
  index.ts                                ⬜ (modify - combine transparent plugin)
```

---

## Dependencies

- `transparent` plugin - For marking transparent entities
- `scene` plugin - For camera position (sorting)
- `materials` plugin - For material transparency lookup
- Existing volume model rendering systems

---

## Success Criteria

✅ Transparent volume models render after opaque models  
✅ Transparent volumes show through to other volumes correctly  
✅ Depth sorting works correctly (furthest transparent volumes rendered first)  
✅ Instancing efficiency maintained (grouping by vertex buffer preserved)  
✅ Performance acceptable (sorting cost reasonable)  
✅ Works with scale and rotation transforms  
✅ Works with existing house chunk sample (glass windows show through)

---

## Future Enhancements

1. **Per-Voxel Transparency**: Support volumes with mixed opaque/transparent voxels (would require per-face or per-vertex transparency)
2. **OIT (Order-Independent Transparency)**: For better quality with many overlapping transparent surfaces
3. **Transparency Threshold**: Allow configurable alpha threshold for transparency detection
4. **Volume LOD**: Could skip sorting for very small/distant volumes

