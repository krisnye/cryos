import { Vec4 } from "@adobe/data/math";
import { U32Schema, FromSchema } from "@adobe/data/schema";

export type Rgba = FromSchema<typeof Rgba.schema>;

export namespace Rgba {
    export const schema = U32Schema;
    export const toVec4 = (rgba: Rgba): Vec4 => {
        return [
            ((rgba >>> 0) & 0xFF) / 255,   // Red   - bits 0-7
            ((rgba >>> 8) & 0xFF) / 255,    // Green - bits 8-15
            ((rgba >>> 16) & 0xFF) / 255,   // Blue  - bits 16-23
            ((rgba >>> 24) & 0xFF) / 255    // Alpha - bits 24-31
        ]
    }

    export const fromVec4 = (vec4: Vec4): Rgba => {
        return (vec4[0] * 255) << 0 | (vec4[1] * 255) << 8 | (vec4[2] * 255) << 16 | (vec4[3] * 255) << 24;
    }

    export const isVisible = (rgba: Rgba): boolean => {
        return ((rgba >>> 24) & 0xFF) !== 0; // Alpha is in highest 8 bits, visible if non-zero
    }
}
