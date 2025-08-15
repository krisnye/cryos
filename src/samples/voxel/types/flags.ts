// Face visibility flags for cube particles
// These correspond directly to the face masks used in particles.wgsl

import { FACE } from "./face.js";

// Using directional naming: POS_Z, POS_X, NEG_Z, NEG_X, POS_Y, NEG_Y
export const INVISIBLE_OFFSET = 0;
export const INVISIBLE_MASK = 0b111111;  // 63 - all 6 faces hidden
export const INVISIBLE_POS_Z = INVISIBLE_OFFSET + 1 << FACE.POS_Z;   // 0b000001 = 1  (front face, +Z direction)
export const INVISIBLE_POS_X = INVISIBLE_OFFSET + 1 << FACE.POS_X;   // 0b000010 = 2  (right face, +X direction)
export const INVISIBLE_NEG_Z = INVISIBLE_OFFSET + 1 << FACE.NEG_Z;   // 0b000100 = 4  (back face, -Z direction)
export const INVISIBLE_NEG_X = INVISIBLE_OFFSET + 1 << FACE.NEG_X;   // 0b001000 = 8  (left face, -X direction)
export const INVISIBLE_POS_Y = INVISIBLE_OFFSET + 1 << FACE.POS_Y;   // 0b010000 = 16 (top face, +Y direction)
export const INVISIBLE_NEG_Y = INVISIBLE_OFFSET + 1 << FACE.NEG_Y;   // 0b100000 = 32 (bottom face, -Y direction)

// Face selection flags for cube particles
// These use the next 6 bits (bits 6-11)
export const SELECTED_OFFSET = 6;
export const SELECTED_MASK = 0b111111000000;  // 4032 - all 6 faces selected
export const SELECTED_POS_Z = SELECTED_OFFSET + 1 << FACE.POS_Z;   // 0b000001000000 = 64
export const SELECTED_POS_X = SELECTED_OFFSET + 1 << FACE.POS_X;   // 0b000010000000 = 128
export const SELECTED_NEG_Z = SELECTED_OFFSET + 1 << FACE.NEG_Z;   // 0b000100000000 = 256
export const SELECTED_NEG_X = SELECTED_OFFSET + 1 << FACE.NEG_X;   // 0b001000000000 = 512
export const SELECTED_POS_Y = SELECTED_OFFSET + 1 << FACE.POS_Y;   // 0b010000000000 = 1024
export const SELECTED_NEG_Y = SELECTED_OFFSET + 1 << FACE.NEG_Y;   // 0b100000000000 = 2048

