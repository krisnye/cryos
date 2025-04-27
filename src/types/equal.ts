/**
 * Type level equality check.
 * Returns true if types X and Y are exactly equal, false otherwise.
 */
export type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false; 