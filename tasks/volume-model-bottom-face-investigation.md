# Volume Model Bottom Face Rendering Investigation

**Status**: 📋 PLANNED  
**Goal**: Investigate and identify root cause of odd rendering when viewing volume models from underneath using a simple test case.

## Overview

The volume model rendering appears correct from all sides and top, but shows odd rendering when viewed from an upwards angle (from underneath). This investigation uses a simple 2x2x2 test volume with unique materials per voxel to isolate and verify bottom face rendering.

---

## Test Volume Specification

**Volume**: 2x2x2 (8 voxels total)  
**Materials**: Each voxel gets a unique material for easy identification  
**Position**: Centered or at origin for easy inspection  
**Purpose**: Simple shape to verify:
- Bottom faces are generated correctly
- Bottom faces render with correct geometry
- Bottom faces have correct normals
- Bottom faces have correct lighting when viewed from below

---

## Phase 1: Create Simple Test Volume Generator

**File**: `cryos/src/samples/volume-model-sample/create-test-volume.ts`

**Requirements**:
- Function `createTestVolume2x2x2()` that returns `Volume<MaterialId>`
- Volume size: `[2, 2, 2]`
- Each of the 8 voxels gets a unique material:
  - `[0,0,0]` → Material ID 1
  - `[1,0,0]` → Material ID 2
  - `[0,1,0]` → Material ID 3
  - `[1,1,0]` → Material ID 4
  - `[0,0,1]` → Material ID 5
  - `[1,0,1]` → Material ID 6
  - `[0,1,1]` → Material ID 7
  - `[1,1,1]` → Material ID 8
- Use existing opaque materials from `Material.id` (concrete, wood, steel, etc.)
- If not enough unique materials, use the same material but the unique pattern will help identify voxels

**Verification**:
- Unit test to verify all 8 voxels have expected materials
- Verify volume size is exactly `[2, 2, 2]`

---

## Phase 2: Add Test Verification Functions

**File**: `cryos/src/plugins/volume-model-rendering/material-volume-to-vertex-data.test.ts` (or new test file)

**Functions to Add**:

### `extractBottomFaceVertices(vertexData: TypedBuffer<PositionNormalMaterialVertex>): Vec3[]`
- Extract all vertices with normal `[0, -1, 0]`
- Return array of vertex positions
- Used to verify bottom faces are generated

### `verifyBottomFaceGeometry(bottomVertices: Vec3[], expectedVoxelPositions: Vec3[]): boolean`
- Check that bottom face vertices match expected voxel positions
- Verify vertices are at y=0 (bottom plane)
- Verify vertices form expected quads/triangles

### `countBottomFaces(vertexData: TypedBuffer<PositionNormalMaterialVertex>): number`
- Count bottom faces (groups of 6 vertices with normal `[0, -1, 0]`)
- Should be 4 for a 2x2x2 solid volume (bottom layer has 4 voxels, each with 1 bottom face)
- Verify expected face count matches actual

**Verification**:
- Unit tests for each verification function
- Test with 2x2x2 volume
- Verify bottom faces are generated for all bottom-layer voxels

---

## Phase 3: Create Minimal Test Sample Application

**Option A: Extend Existing Sample**
- Modify `volume-model-sample-service.ts` to optionally use test volume instead of house chunk
- Add flag/parameter to switch between test and house volume
- Allows side-by-side comparison

**Option B: Create New Test Sample** (preferred for isolation)
- New directory: `cryos/src/samples/volume-model-test-sample/`
- New service: `volume-model-test-sample-service.ts`
- New application: `volume-model-test-sample-application.ts`
- Register in `sample-container.ts` for easy access

**Requirements**:
- Create 2x2x2 test volume using `createTestVolume2x2x2()`
- Position at origin `[0, 0, 0]` or slightly offset for visibility
- Scale: 1.0 (1 unit per voxel) for easy inspection
- Camera setup:
  - Initial position: View from side/top for overview
  - Enable orbit camera control for manual inspection
  - Add camera presets:
    - View from below (negative Y)
    - View from side (positive X)
    - View from front (positive Z)
    - View from diagonal
- Render axis helper for reference

**Verification**:
- Sample application renders correctly
- Camera controls work
- Test volume is visible

---

## Phase 4: Verify Bottom Face Generation

**Tests to Run**:

### Geometry Verification
- [ ] Verify bottom faces are generated for 2x2x2 volume (should be 4 faces = 24 vertices)
- [ ] Verify bottom face vertices have correct positions (y=0 plane)
- [ ] Verify bottom face normals are `[0, -1, 0]`
- [ ] Verify bottom face winding order (counter-clockwise when viewed from -Y)

### Visual Verification
- [ ] View from side (X or Z axis): Bottom faces should be visible as edges
- [ ] View from below (negative Y): Bottom faces should be visible as quads
- [ ] Verify each of the 4 bottom voxels has a visible bottom face
- [ ] Verify bottom faces have correct material colors

**Tools**:
- Use verification functions from Phase 2
- Manual visual inspection with camera controls
- Screenshots from multiple angles

---

## Phase 5: Verify Bottom Face Rendering

**Tests to Run**:

### Lighting Verification
- [ ] View from below: Bottom faces should have correct lighting
- [ ] Verify specular highlights are correct (if material is metallic/rough)
- [ ] Verify diffuse shading is correct
- [ ] Compare lighting on bottom faces vs. top faces (should be similar but inverted)

### Depth/Visibility Verification
- [ ] Verify bottom faces are not culled when viewing from below
- [ ] Verify bottom faces render in correct depth order
- [ ] Verify no z-fighting on bottom faces
- [ ] Verify bottom faces are not transparent when they shouldn't be

**Tools**:
- Visual inspection from multiple camera angles
- Compare with top face rendering (which works correctly)
- Check for any visual artifacts

---

## Phase 6: Document Findings

**Documentation Tasks**:
- [ ] Document what works correctly:
  - Top faces render correctly from all angles
  - Side faces render correctly from all angles
  - Bottom faces are generated with correct geometry
  
- [ ] Document what doesn't work:
  - Specific visual issues when viewing from below
  - Any lighting inconsistencies
  - Any geometry issues
  
- [ ] Identify root cause:
  - Is it a geometry issue? (winding, normals)
  - Is it a lighting issue? (view direction, normals)
  - Is it a rendering pipeline issue? (culling, depth)
  - Is it a shader issue? (view direction calculation - already fixed)
  
- [ ] Create comparison:
  - Side-by-side comparison of top vs. bottom face rendering
  - Before/after if fix is identified

---

## Success Criteria

1. **Test Volume Created**: 2x2x2 volume with unique materials renders correctly
2. **Verification Functions**: Automated checks confirm bottom faces are generated correctly
3. **Visual Verification**: Manual inspection shows bottom faces render correctly from all angles
4. **Root Cause Identified**: Document the specific issue causing odd rendering
5. **Fix Validation**: If fix is applied, verify it works with both test volume and house chunk

---

## Implementation Order

1. **Phase 1**: Create test volume generator (simple, isolated)
2. **Phase 2**: Add verification functions (can test independently)
3. **Phase 3**: Create test sample application (requires Phases 1-2)
4. **Phase 4**: Run geometry verification tests (automated + manual)
5. **Phase 5**: Run rendering verification (visual inspection)
6. **Phase 6**: Document findings and identify root cause

---

## Notes

- The view direction calculation fix has already been applied (camera position now passed to shader)
- This investigation should help identify if there are other issues beyond view direction
- The simple 2x2x2 volume makes it easy to count and verify faces
- Unique materials per voxel help identify which voxel is which in visual inspection

