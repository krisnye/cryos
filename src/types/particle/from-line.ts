import { Line3, Vec3, Quat } from "@adobe/data/math";
import type { Particle } from "./particle.js";

/**
 * Creates transforms for a line particle by using a single voxel centered at the midpoint of the line
 * and with rotation aligned to the line direction and appropriate scale to fit the line.
 * 
 * @param props.line - The line segment to create transforms for
 * @param props.radius - The radius (half-width) of the line particle (default: 0.5)
 * @param props.twist - Additional rotation around the line direction in radians (default: 0.0)
 * @returns Particle transforms (position, scale, rotation) - material must be provided separately
 */
export const fromLine = (props: { 
    line: Line3; 
    radius?: number; 
    twist?: number 
}): Pick<Particle, 'position' | 'scale' | 'rotation'> => {
    const { line, radius = 0.5, twist = 0.0 } = props;
    const { a, b } = line;
    
    // Midpoint for centered placement
    const midpoint = Line3.interpolate(line, 0.5);
    
    // Direction and length
    const length = Vec3.length(Vec3.subtract(b, a));
    
    // Align local Z to the line direction, with optional twist
    const rotation: Quat = Quat.alignTo(Line3.direction(line), twist);
    
    // Scale elongated along Z (the model's long axis)
    const scale: Vec3 = [radius * 2, radius * 2, length];
    
    return {
        position: midpoint,
        scale,
        rotation,
    };
};

