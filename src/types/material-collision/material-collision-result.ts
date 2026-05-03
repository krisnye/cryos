/**
 * Required output for a collision solve.
 * No optional fields so downstream systems can remain branch-light.
 */
export interface MaterialCollisionResult {
    relativeNormalSpeedMps: number;
    impulseNs: number;
    impactEnergyJ: number;
    damageToA: number;
    damageToB: number;
    nextHealthA: number;
    nextHealthB: number;
    fracturedA: boolean;
    fracturedB: boolean;
}
