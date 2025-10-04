import { Vec4 } from "@adobe/data/math";
import { U32Schema, FromSchema } from "@adobe/data/schema";

export const schema = U32Schema
export type Type = FromSchema<typeof schema>;

export const toVec4 = (rgba: Type): Vec4 => {
    return [
        (rgba >>> 0) & 0xFF / 255,
        (rgba >>> 8) & 0xFF / 255,
        (rgba >>> 16) & 0xFF / 255,
        (rgba >>> 24) & 0xFF / 255
    ]
}

export const fromVec4 = (vec4: Vec4): Type => {
    return (vec4[0] * 255) << 0 | (vec4[1] * 255) << 8 | (vec4[2] * 255) << 16 | (vec4[3] * 255) << 24;
}

export const isVisible = (rgba: Type): boolean => {
    return (rgba & 0xFF) !== 0; // Alpha is in lowest 8 bits, visible if non-zero
}
