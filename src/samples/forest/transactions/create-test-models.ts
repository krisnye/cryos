import { Quat } from "@adobe/data/math";
import { createAxis } from "../../../graphics/database/index.js";
import { createTree } from "../functions/create-tree.js";
import { particlesToVertexData } from "graphics/functions/particles-to-vertex-data.js";
import { ForestStore } from "../forest-service.js";

export const createTestModels = (t: ForestStore) => {   
    createAxis(t);

    // Forest configuration
    const forestSize = 160; // Size of both ground plane and tree distribution area
    const treeCount = 1000;

    // Create a large flat ground plane as a scaled particle
    t.archetypes.Particle.insert({
        position: [0, 0, -0.5], // Just below Z=0
        scale: [forestSize, forestSize, 0.1], // Match forest size
        rotation: Quat.identity,
        color: [0.4, 0.4, 0.4, 1.0] // Gray ground for contrast
    });

    // Create a procedural tree template (generates the vertex data once)
    const treeParticles = createTree({
        position: [0, 0, 0],
        segmentLength: 1.5,
        initialThickness: 0.4,
        thicknessDecay: 0.65,
        maxDepth: 7,
        branchAngle: Math.PI / 5,
        branchCount: 3,
        twist: Math.PI / 3,
    });

    // Convert to vertex data once - this will be shared by all trees!
    const treeVertexData = particlesToVertexData(treeParticles);
    
    for (let i = 0; i < treeCount; i++) {
        // Random position in the forest area
        const x = (Math.random() - 0.5) * forestSize;
        const y = (Math.random() - 0.5) * forestSize;
        const z = 0; // All trees rooted at ground level
        
        // Random rotation around Z axis (trees pointing up but rotated)
        const rotationZ = Math.random() * Math.PI * 2;
        
        // Random scale variation (80% to 120% of original size)
        const scaleVariation = 0.1 + Math.random() * 0.9;
        
        t.archetypes.VertexModel.insert({
            position: [x, y, z],
            scale: [scaleVariation, scaleVariation, scaleVariation],
            rotation: Quat.fromAxisAngle([0, 0, 1], rotationZ),
            vertexData: treeVertexData // All share the same vertex data!
        });
    }
};

