# Material Collision Damage Model Epic

**Status**: 📋 PLANNED  
**Goal**: Define a strict collision contract, mechanical material model, and deterministic damage algorithm for voxel impacts.

## Overview

WHY we need this is to turn collisions into predictable gameplay outcomes with clear tuning knobs, so material interactions (like steel vs glass) feel believable while remaining simple, testable, and maintainable in the ECS architecture.

---

## Collision Contract Baseline

Lock the collision solver API to required-only inputs and outputs so every caller provides complete context and receives complete results.

**Requirements**:
- Given two colliding bodies, should require material identity, velocity, volume, and health for both participants.
- Given any collision solve, should require contact normal, contact area, and timestep values with no implicit defaults.
- Given any collision result, should always provide impulse, impact energy, per-body damage, per-body next health, and fracture flags.

---

## Mechanical Material Profile

Define a minimal mechanical property set for impact behavior that complements existing thermal and rendering fields.

**Requirements**:
- Given material definitions, should use the bilinear uniaxial profile already on `Material`: four `[strain, stress MPa]` points (tensile/compressive yield and fracture), derived Young’s moduli (`Material.youngsModulusTension` / `Compression`), and `restitution`.
- Given existing materials, should provide explicit mechanical defaults so no material is left with undefined collision behavior.
- Given future material additions, should keep the profile composable and data-oriented without introducing class hierarchies.

---

## Damage Transfer Algorithm

Specify a deterministic first-pass algorithm that maps relative motion and mass into damage for both bodies.

**Requirements**:
- Given relative velocity along the contact normal and body masses, should compute a stable impact scalar independent of call site.
- Given asymmetric materials and volumes, should distribute impact consequences across both bodies in a tunable and explainable way.
- Given computed impact outcomes, should map energy to damage and health deltas using material-specific resistance parameters.

---

## Voxel Health Mapping and Calibration

Map continuous damage results to `PhysicalVoxel` health storage and validate behavior with representative material pair tests.

**Requirements**:
- Given continuous solver outputs, should define a consistent quantization strategy for voxel health representation.
- Given impacts below meaningful thresholds, should avoid noisy micro-damage updates in voxel state.
- Given canonical collision scenarios, should include acceptance tests that verify believable ordering of outcomes across material pairs.

---
