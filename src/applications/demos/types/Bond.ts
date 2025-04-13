import { Schema } from "../../../data/Schema";
import { F32Schema } from "../../../data/F32";
import { U32Schema } from "../../../data/U32";
import type { InferType } from "../../../data/Schema";

export const BondSchema = {
    type: 'object',
    properties: {
        atom1: U32Schema,
        atom2: U32Schema,
        length: F32Schema,
        strength: F32Schema,
    }
} as const satisfies Schema;

export type Bond = InferType<typeof BondSchema>;
