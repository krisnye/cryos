import { Schema } from "./schema";

export const TrueSchema = { type: "boolean", const: true, default: true } as const satisfies Schema;

export type True = true;
