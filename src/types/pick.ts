import type { Line3 } from "@adobe/data/math";
import type { PickResult } from "./pick-result.js";

/** Picks along a line in world space; returns hit result or null. */
export type Pick = (line: Line3) => PickResult | null;
