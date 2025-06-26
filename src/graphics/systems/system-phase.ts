import { FromSchema, Schema } from "@adobe/data/schema";

export const SystemUpdatePhaseSchema = {
    enum: [
        "input",
        "preUpdate",
        "update",
        "prePhysics",
        "physics",
        "postPhysics",
        "postUpdate",
    ]
} as const satisfies Schema;

export const SystemRenderPhaseSchema = {
    enum: [
        "preRender",
        "render",
        "postRender",
        "cleanup",
    ]
} as const satisfies Schema;

export const SystemPhaseSchema = {
    enum: [
        ...SystemUpdatePhaseSchema.enum,
        ...SystemRenderPhaseSchema.enum,
    ]
} as const satisfies Schema;
export type SystemPhase = FromSchema<typeof SystemPhaseSchema>;
