import { F32Schema } from "../data/F32.js";
import type { InferType } from "../data/Schema/InferType.js";
import type { Schema } from "../data/Schema/Schema.js";
import { U32Schema } from "../data/U32.js";
import { Vec3Schema } from "../data/Vec3/Vec3.js";

export const AtomSchema = {
    type: 'object',
    properties: {
        position: Vec3Schema,
        velocity: Vec3Schema,
    }
} as const satisfies Schema;

export type Atom = InferType<typeof AtomSchema>;

export const BlockSchema = {
    type: 'object',
    properties: {
        material: U32Schema,
        atoms: {
            type: 'array',
            items: AtomSchema,
            minItems: 4,
            maxItems: 4,
        },
    },
} as const satisfies Schema;

export type Block = InferType<typeof BlockSchema>;

export const BondSchema = {
    type: 'object',
    properties: {
        length: F32Schema,
        stiffness: F32Schema,
    }
} as const satisfies Schema;

export type Bond = InferType<typeof BondSchema>;

export const BondedBlockSchema = {
    type: 'object',
    properties: {
        block: BlockSchema,
        bonds: {
            type: 'array',
            items: BondSchema,
        }
    }
}