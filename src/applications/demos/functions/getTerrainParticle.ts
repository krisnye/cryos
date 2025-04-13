import { Particle } from "../types/Particle";
import { fractalNoise } from "./noise2d";

export const getTerrainParticle = (x: number, y: number): Particle => {
    const scale = 0.15; // Controls the overall scale of the terrain
    const height = fractalNoise(x * scale, y * scale);
    
    // Create more interesting colors based on height
    const r = (height + 1) * 0.5; // normalize to [0,1]
    const g = 0.2 + r * 0.3;      // slight green variation
    const b = 0.4 + r * 0.2;      // slight blue variation
    
    return {
        position: [x, y, height * 2], // Amplify height for more dramatic effect
        color: [r, g, b, 1],
    };
}; 