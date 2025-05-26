import { FromSchema } from "./schema";

export const TrueSchema = { type: "boolean", const: true, default: true } as const;

export type True = FromSchema<typeof TrueSchema>;
