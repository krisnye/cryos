/**
 * Static voxel flags for various properties and states.
 * 
 * These flags are used as bit masks to efficiently store multiple boolean properties
 * in a single integer field.
 */

/**
 * Face visibility flags for voxel rendering optimization.
 * These flags correspond to the face order defined in particles.wgsl:
 * 1. Front face (indices 0-5)
 * 2. Right face (indices 6-11) 
 * 3. Back face (indices 12-17)
 * 4. Left face (indices 18-23)
 * 5. Top face (indices 24-29)
 * 6. Bottom face (indices 30-35)
 * 
 * A face is visible if there is no adjacent voxel on that side.
 * If all faces are invisible (flags = 0), the entire voxel should be skipped during rendering.
 */
export const FRONT_FACE_VISIBLE = 1;   // 0b000001
export const RIGHT_FACE_VISIBLE = 2;   // 0b000010
export const BACK_FACE_VISIBLE = 4;    // 0b000100
export const LEFT_FACE_VISIBLE = 8;    // 0b001000
export const TOP_FACE_VISIBLE = 16;    // 0b010000
export const BOTTOM_FACE_VISIBLE = 32; // 0b100000

/**
 * Mask for all face visibility flags combined
 */
export const ALL_FACES_VISIBLE_MASK = FRONT_FACE_VISIBLE | RIGHT_FACE_VISIBLE | BACK_FACE_VISIBLE | LEFT_FACE_VISIBLE | TOP_FACE_VISIBLE | BOTTOM_FACE_VISIBLE;

/**
 * Additional flags can be defined here as needed:
 * 
 * Example:
 * export const DAMAGED_FLAG = 64;
 * export const BURNING_FLAG = 128;
 * export const FROZEN_FLAG = 256;
 * etc.
 */ 