import { InferType } from "./schema";

export const TrueSchema = { type: "boolean", const: true, default: true } as const;

export type True = InferType<typeof TrueSchema>;
