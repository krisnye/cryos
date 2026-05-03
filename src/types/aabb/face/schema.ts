
import { Schema } from "@adobe/data/schema";

export const schema = {
    type: 'number',
    minimum: 1,
    maximum: 63,
} as const satisfies Schema;

