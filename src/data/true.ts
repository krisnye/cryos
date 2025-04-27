import { InferType } from "./schema";

export const TrueSchema = { const: true } as const;

export type True = InferType<typeof TrueSchema>;
