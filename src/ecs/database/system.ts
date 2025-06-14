import { FromSchema, Schema } from "data/schema";

export type SystemNames = string;
export type SystemPhases = readonly string[];
export const DefaultPhasesSchema = {
  const: ["input", "preUpdate", "update", "prePhysics", "physics", "postPhysics", "postUpdate", "preRender", "render", "postRender"]
} as const satisfies Schema;
export type DefaultPhases = FromSchema<typeof DefaultPhasesSchema>;
export type Systems<Names extends SystemNames, P extends SystemPhases> = { [K in Names]: System<P> }

export interface System<P extends SystemPhases> {
  name: string;
  phase: P[number];
  before?: SystemNames[];
  after?: SystemNames[];
  run: () => void | Promise<void>;
}
