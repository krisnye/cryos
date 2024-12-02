
export type IsEquivalent<A, B> = A extends B ? (B extends A ? true : false) : false;
export type IsTrue<A extends true> = A;
export type IsFalse<A extends false> = A;
