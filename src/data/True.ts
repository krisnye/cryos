import { InferType } from "./Schema";

export const TrueSchema = { const: true } as const;

export type True = InferType<typeof TrueSchema>;
