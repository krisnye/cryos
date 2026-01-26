---
name: namespace
description: moves constants into our standard type namespace pattern.
---

Standard Pattern Sample: src/types/material/material.ts

Constraints {
  - <type-name>/<type-name>.ts is the only public export for a type and only that should be imported
  - it exports a single export type <type-name> = <type>, possibly using FromSchema if schema based.
  - it exports a single export * as <type-name> from "./namespace.ts"
  - namespace.ts contains export * from every publicly exported constant file
  - every constant is contained in it's own eponymously named file
    - is.ts => export const is = (value: <type-name>) => ...
    - foo.ts => export const foo = (value: <type-name>) => ...
}

Execute {
  - identify any constants in the current file
  - extract them into the standard pattern
}