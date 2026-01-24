# Particle Rendering Resource Refactoring Epic

**Status**: 📋 PLANNED  
**Goal**: Move private GPU resources from plugin resources to closure variables in particle rendering systems

## Overview

Particle rendering plugins currently store GPU objects (bind group layouts, pipelines, buffers) as plugin resources, but these are only accessed within a single system and never shared between systems or plugins. Resources should only be used for shared state between systems/plugins. Moving these to closure variables improves encapsulation, reduces resource namespace pollution, and makes the code's intent clearer while maintaining the same caching behavior.

---

## Refactor particle-rendering-base.ts

Move baseBindGroupLayout, basePipeline, basePositionBuffer, and baseMaterialIndexBuffer from plugin resources to closure variables in renderParticlesBase.create().

**Requirements**:
- Given the system runs multiple frames, should cache GPU objects in closure variables
- Given GPU objects are created, should initialize them only once and reuse across frames
- Given buffers need resizing, should update closure variables when buffers are recreated

---

## Refactor particle-rendering-scale.ts

Move scaleBindGroupLayout, scalePipeline, scalePositionBuffer, scaleMaterialIndexBuffer, and scaleBuffer from plugin resources to closure variables.

**Requirements**:
- Given the system runs multiple frames, should cache GPU objects in closure variables
- Given GPU objects are created, should initialize them only once and reuse across frames
- Given buffers need resizing, should update closure variables when buffers are recreated

---

## Refactor particle-rendering-rotation.ts

Move rotationBindGroupLayout, rotationPipeline, rotationPositionBuffer, rotationMaterialIndexBuffer, and rotationBuffer from plugin resources to closure variables.

**Requirements**:
- Given the system runs multiple frames, should cache GPU objects in closure variables
- Given GPU objects are created, should initialize them only once and reuse across frames
- Given buffers need resizing, should update closure variables when buffers are recreated

---

## Refactor particle-rendering-scale-rotation.ts

Move scaleRotationBindGroupLayout, scaleRotationPipeline, scaleRotationPositionBuffer, scaleRotationMaterialIndexBuffer, scaleRotationScaleBuffer, and scaleRotationRotationBuffer from plugin resources to closure variables.

**Requirements**:
- Given the system runs multiple frames, should cache GPU objects in closure variables
- Given GPU objects are created, should initialize them only once and reuse across frames
- Given buffers need resizing, should update closure variables when buffers are recreated

---

## Refactor transparent particle rendering variants

Move resources from all four transparent particle rendering plugins (transparent-base, transparent-scale, transparent-rotation, transparent-scale-rotation) to closure variables.

**Requirements**:
- Given the system runs multiple frames, should cache GPU objects in closure variables
- Given GPU objects are created, should initialize them only once and reuse across frames
- Given buffers need resizing, should update closure variables when buffers are recreated
- Given transparent rendering requires CPU-side buffers for sorting, should cache those in closure variables too

