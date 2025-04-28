
export function mapValues<
  T extends Record<string, unknown>,
  R
>(
  obj: T,
  fn: <K extends keyof T>(value: T[K], key: K, obj: T) => R
): { [K in keyof T]: R } {
  const out = {} as { [K in keyof T]: R };

  (Object.keys(obj) as Array<keyof T>).forEach(k => {
    out[k] = fn(obj[k], k, obj);
  });

  return out;
}
