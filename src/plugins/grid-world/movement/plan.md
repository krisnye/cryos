# 📋 Plan: Grid-World Movement System

**Status**: 📋 PLANNED  
**Goal**: Create a high-performance movement system that applies velocity to position using fixed timestep (60fps) with direct TypedArray manipulation

## Overview

This system will update entity positions based on their velocity components using a fixed timestep of 1/60 seconds (16.67ms) per frame. For optimal performance, it will use archetype queries and direct Float32Array manipulation to avoid object allocations.

---

## Task 1: Create Movement System Structure

**Requirements**:
- Create `grid-world/movement/movement.ts` plugin file
- Extend `physics` plugin (provides `velocity` component)
- Create system that runs during `["update"]` phase
- Use fixed timestep: `const dt = 1 / 60` (0.016666... seconds)

**Scope**: 
- File: `cryos/src/plugins/grid-world/movement/movement.ts`
- Plugin structure with system definition

---

## Task 2: Implement Archetype Query

**Requirements**:
- Query entities with both `position` and `velocity` components
- Use: `db.store.queryArchetypes(["position", "velocity"])`
- Handle empty results gracefully (early return)

**Scope**: 
- Query pattern matching existing systems (e.g., `particle-rendering-base.ts`)
- Early exit if no entities found

---

## Task 3: Implement Direct TypedArray Updates

**Requirements**:
- For each archetype table:
  - Get position typed array: `table.columns.position.getTypedArray()` → `Float32Array`
  - Get velocity typed array: `table.columns.velocity.getTypedArray()` → `Float32Array`
  - Iterate through rows: `for (let i = 0; i < table.rowCount; i++)`
  - Directly update position values:
    - `position[i * 3 + 0] += velocity[i * 3 + 0] * dt` (x)
    - `position[i * 3 + 1] += velocity[i * 3 + 1] * dt` (y)
    - `position[i * 3 + 2] += velocity[i * 3 + 2] * dt` (z)

**Performance Notes**:
- Vec3 components are stored as 3 consecutive floats: `[x0, y0, z0, x1, y1, z1, ...]`
- Access pattern: `index * 3 + component` where component is 0=x, 1=y, 2=z
- Direct Float32Array manipulation avoids object allocations
- No `Vec3` object creation during update loop

**Scope**: 
- Core update loop with direct memory access
- Fixed timestep multiplication

---

## Task 4: Export and Integrate Plugin

**Requirements**:
- Export plugin as `movement` from `movement.ts`
- Update `grid-world.ts` to extend `movement` plugin
- Or create index file if needed: `movement/index.ts`

**Scope**: 
- Plugin export
- Integration with grid-world plugin

---

## Task 5: Verify System Works

**Requirements**:
- Test that bullets created in `pick-input.ts` move correctly
- Verify movement speed matches: `number * 100 m/s * (1/60) s/frame`
- Check that particles move toward target position

**Scope**: 
- Manual testing with grid-world sample
- Verify bullet particles move as expected

---

## Implementation Details

### Fixed Timestep
```typescript
const dt = 1 / 60; // Fixed timestep for 60fps (0.016666... seconds)
```

### Update Pattern
```typescript
const positionArray = table.columns.position.getTypedArray() as Float32Array;
const velocityArray = table.columns.velocity.getTypedArray() as Float32Array;

for (let i = 0; i < table.rowCount; i++) {
    const baseIdx = i * 3;
    positionArray[baseIdx + 0] += velocityArray[baseIdx + 0] * dt; // x
    positionArray[baseIdx + 1] += velocityArray[baseIdx + 1] * dt; // y
    positionArray[baseIdx + 2] += velocityArray[baseIdx + 2] * dt; // z
}
```

### File Structure
```
cryos/src/plugins/grid-world/
  ├── grid-world.ts
  └── movement/
      └── movement.ts
```

---

## Performance Considerations

1. **Direct Memory Access**: Using `getTypedArray()` provides direct access to underlying Float32Array
2. **No Object Allocations**: Avoid creating Vec3 objects in the update loop
3. **Cache-Friendly**: Sequential memory access pattern
4. **Fixed Timestep**: Deterministic physics, frame-rate independent movement speed

---

## Future Enhancements (Out of Scope)

- Variable timestep support
- Collision detection
- Velocity damping/friction
- Acceleration forces
- Integration with physics solver

