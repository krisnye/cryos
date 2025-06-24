import { FromSchema, Schema } from "@adobe/data/schema";

export const SystemPhaseSchema = {
    enum: [
        "input",
        "preUpdate",
        "update",
        "prePhysics",
        "physics",
        "postPhysics",
        "postUpdate",
        "preRender",
        "render",
        "postRender",
        "cleanup",
    ]
} as const satisfies Schema;

export type SystemPhase = FromSchema<typeof SystemPhaseSchema>;
