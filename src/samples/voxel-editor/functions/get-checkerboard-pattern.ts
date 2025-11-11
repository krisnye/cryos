import { Vec3 } from "@adobe/data/math";

/**
 * Determines checkerboard pattern for a position in 3D space.
 * Creates a true 3D checkerboard pattern (like a 3D chess cube).
 * Returns true for light squares, false for dark squares.
 */
export const getCheckerboardPattern = (position: Vec3): boolean => {
    const ix = Math.floor(position[0]);
    const iy = Math.floor(position[1]);
    const iz = Math.floor(position[2]);
    
    // 3D checkerboard: (x + y + z) % 2 determines the color
    return (ix + iy + iz) % 2 === 0;
};

