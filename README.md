# cryos
WebGPU Graphics Library

## Naming Conventions

| Scope | Pattern | Examples | Notes |
|-------|---------|----------|-------|
| **All folders** | `kebab-case/` | `vec3/`, `mat4x4/`, `user-profile/` | One folder ≈ one concept. |
| **All files** | `kebab-case.ts` | `vec3.ts`, `mat4x4.ts`, `add.ts`, `normalize.ts` | All files must use kebab-case, including type files. |
| **Type-only files** | `kebab-case.ts` | `vec3.ts`, `mat4x4.ts` | *Must* contain **only** `type` / `interface` / `enum`. No runtime code. |
| **Runtime function files** | `kebab-case.ts` | `add.ts`, `normalize.ts`, `lerp.ts` | One pure function per file. |
| **Domain index** | `index.ts` (lower-case) | `vec3/index.ts` | Re-export **all public** items for the domain.<br>Also export a lower-case namespace object that bundles the functions (e.g. `export const vec3 = { add, normalize }`). |
| **Namespace objects** | lower-case value that mirrors the type | `vec3`, `mat4x4` | Keeps call-sites clear: `vec3.add(a, b)`. |
| **Barrel imports** | `UPPER_CASE` | `VEC3`, `MAT4X4` | When importing from barrel files, use UPPER_CASE. |
| **Imports in code** | — | ```ts import { VEC3 } from 'my-lib/vec3'; import type { Vec3 } from 'my-lib/vec3'; ``` | No root-level barrel—import directly from the domain folder. |

Quick guidelines:

1. **All files and folders use kebab-case** - this is a strict rule for consistency.
2. **No default exports**—always named exports to aid tree-shaking.
3. **Never put runtime code in type-only files**; it vanishes after `tsc` and breaks bundlers.
4. **Add public APIs in the domain `index.ts` only**; internal helpers stay un-exported or in `_internal/`.
5. **When importing from barrel files, use UPPER_CASE** for the imported names.

Copy-paste these rules into new code reviews to keep the structure predictable and IDE-friendly.
