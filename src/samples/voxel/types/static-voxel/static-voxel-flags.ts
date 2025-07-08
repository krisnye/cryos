/**
 * Static voxel flags for various properties and states.
 * 
 * These flags are used as bit masks to efficiently store multiple boolean properties
 * in a single integer field.
 */

/**
 * Face invisibility flags for voxel rendering optimization.
 * These flags correspond to the face order defined in particles.wgsl:
 * 1. Front face (indices 0-5)
 * 2. Right face (indices 6-11) 
 * 3. Back face (indices 12-17)
 * 4. Left face (indices 18-23)
 * 5. Top face (indices 24-29)
 * 6. Bottom face (indices 30-35)
 * 
 * A face is invisible if there is an adjacent voxel on that side.
 * If all faces are invisible (flags = ALL_FACES_INVISIBLE_MASK), the entire voxel should be skipped during rendering.
 */
export const FRONT_FACE_INVISIBLE = 1;   // 0b000001
export const RIGHT_FACE_INVISIBLE = 2;   // 0b000010
export const BACK_FACE_INVISIBLE = 4;    // 0b000100
export const LEFT_FACE_INVISIBLE = 8;    // 0b001000
export const TOP_FACE_INVISIBLE = 16;    // 0b010000
export const BOTTOM_FACE_INVISIBLE = 32; // 0b100000

/**
 * Mask for all face invisibility flags combined
 */
export const ALL_FACES_INVISIBLE_MASK = FRONT_FACE_INVISIBLE | RIGHT_FACE_INVISIBLE | BACK_FACE_INVISIBLE | LEFT_FACE_INVISIBLE | TOP_FACE_INVISIBLE | BOTTOM_FACE_INVISIBLE;

/**
 * Additional flags can be defined here as needed:
 * 
 * Example:
 * export const DAMAGED_FLAG = 64;
 * export const BURNING_FLAG = 128;
 * export const FROZEN_FLAG = 256;
 * etc.
 */ 