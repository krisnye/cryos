import { GraphicsStore } from "graphics/database/graphics-store.js";
import { Quat } from "@adobe/data/math";

export function createAxis(t: GraphicsStore) {
    // Black particle at center (no rotation)
    t.archetypes.Particle.insert({
        position: [0, 0, 0],
        color: [0, 0, 0, 1],
        scale: [1, 1, 1],
        rotation: Quat.identity()
    } as never);

    const size = 3;
    const girth = 0.35;
    
    // Red particle on X-axis (no rotation - aligned with X)
    t.archetypes.Particle.insert({
        position: [size / 2, 0, 0],
        color: [1, 0, 0, 1],
        scale: [size, girth, girth],
        rotation: Quat.identity()
    } as never);
    
    // Green particle on Y-axis (no rotation - aligned with Y)
    t.archetypes.Particle.insert({
        position: [0, size / 2, 0],
        color: [0, 1, 0, 1],
        scale: [girth, size, girth],
        rotation: Quat.identity()
    } as never);
    
    // Blue particle on Z-axis (rotated 45 degrees around Y axis to demonstrate rotation)
    t.archetypes.Particle.insert({
        position: [0, 0, size / 2],
        color: [0, 0, 1, 1],
        scale: [girth, girth, size],
        rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4) // 45 degree rotation around Y axis
    } as never);
}
