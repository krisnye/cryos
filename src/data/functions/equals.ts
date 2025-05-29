import { Data } from "data/data";

export function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;                            // same ref / primitive
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;

  /* ---------- arrays ---------- */
  if (isArrayA) {
    const arrayA = a as Data[];
    const arrayB = b as Data[];
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
      if (!equals(arrayA[i], arrayB[i])) return false;
    }
    return true;
  }

  /* ---------- plain objects ---------- */
  let count = 0;

  // first pass: every own key in a must exist in b and match
  for (const k in a as Record<string, Data>) {
    count++;
    if (!equals(
          (a as Record<string, Data>)[k],
          (b as Record<string, Data>)[k])) return false;
  }

  // second pass: ensure b doesn't have extra keys
  for (const k in b as Record<string, Data>) {
    if (Object.hasOwn(b, k)) count--;
  }

  return count === 0;  // zero => same key count
}
