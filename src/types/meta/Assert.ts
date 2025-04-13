/**
 * Type level assertion that T must extend true.
 * Used for compile-time type checking.
 */
export type Assert<T extends true> = T; 