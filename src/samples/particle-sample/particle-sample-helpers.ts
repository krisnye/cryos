// Helper functions for creating particle sample content

import { Quat } from "@adobe/data/math";
import { Material } from "../../types/index.js";
import type { Database } from "@adobe/data/ecs";

/**
 * Create demonstration particles showing scale, rotation, and scale+rotation variants
 */
export function createSampleParticles(db: Database<any, any, any, any, any, any>): void {
    const offset = 3; // Offset for different particle groups
    
    // Scale-only particles (right side, positive X)
    const scaleArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "scale"]);
    scaleArchetype.insert({
        particle: true,
        position: [offset, 0, 0],
        material: Material.id.metaRed,
        scale: [2, 1, 1] // Stretched along X
    });
    scaleArchetype.insert({
        particle: true,
        position: [offset, 1.5, 0],
        material: Material.id.metaGreen,
        scale: [1, 2, 1] // Stretched along Y
    });
    scaleArchetype.insert({
        particle: true,
        position: [offset, -1.5, 0],
        material: Material.id.metaBlue,
        scale: [1, 1, 2] // Stretched along Z
    });
    
    // Rotation-only particles (left side, negative X)
    const rotationArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "rotation"]);
    rotationArchetype.insert({
        particle: true,
        position: [-offset, 0, 0],
        material: Material.id.metaRed,
        rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4) // 45° around X
    });
    rotationArchetype.insert({
        particle: true,
        position: [-offset, 1.5, 0],
        material: Material.id.metaGreen,
        rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4) // 45° around Y
    });
    rotationArchetype.insert({
        particle: true,
        position: [-offset, -1.5, 0],
        material: Material.id.metaBlue,
        rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4) // 45° around Z
    });
    
    // Scale + Rotation particles (front side, positive Z)
    const scaleRotationArchetype = db.store.ensureArchetype(["id", "particle", "position", "material", "scale", "rotation"]);
    scaleRotationArchetype.insert({
        particle: true,
        position: [0, 0, offset],
        material: Material.id.metaRed,
        scale: [2, 0.5, 0.5],
        rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4)
    });
    scaleRotationArchetype.insert({
        particle: true,
        position: [0, 1.5, offset],
        material: Material.id.metaGreen,
        scale: [0.5, 2, 0.5],
        rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4)
    });
    scaleRotationArchetype.insert({
        particle: true,
        position: [0, -1.5, offset],
        material: Material.id.metaBlue,
        scale: [0.5, 0.5, 2],
        rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4)
    });
}

/**
 * Create a pyramid/grid of all materials
 * Creates a pyramid shape where each layer is a square grid
 */
export function createMaterialPyramid(db: Database<any, any, any, any, any, any>): void {
    // Get all material names (keys from Material.id)
    const materialNames = Object.keys(Material.id) as Array<keyof typeof Material.id>;
    const totalMaterials = materialNames.length;
    
    // Position the pyramid in the x,y plane with +z as up (offset from origin)
    const pyramidBaseZ = -5;
    const pyramidCenterX = 0;
    const pyramidCenterY = 6;
    const spacing = 1.2; // Spacing between cubes
    
    // First pass: calculate how many layers we need
    let layerCount = 0;
    let materialsUsed = 0;
    while (materialsUsed < totalMaterials) {
        const layerSize = layerCount + 1;
        materialsUsed += layerSize * layerSize;
        if (materialsUsed <= totalMaterials) {
            layerCount++;
        }
    }
    
    const baseArchetype = db.store.ensureArchetype(["id", "particle", "position", "material"]);
    let materialIndex = 0;
    let layer = 0;
    
    // Build pyramid layer by layer (each layer is a square grid)
    // Layer 0 is smallest (top), layer N is largest (base)
    while (materialIndex < totalMaterials) {
        const layerSize = layer + 1; // Layer 0 = 1x1, Layer 1 = 2x2, Layer 2 = 3x3, etc.
        // Stack layers along Z axis (base at lower Z, top at higher Z)
        const layerZ = pyramidBaseZ + (layerCount - 1 - layer) * spacing;
        
        // Create a square grid for this layer in the x,y plane
        for (let x = 0; x < layerSize && materialIndex < totalMaterials; x++) {
            for (let y = 0; y < layerSize && materialIndex < totalMaterials; y++) {
                const materialName = materialNames[materialIndex];
                const materialId = Material.id[materialName];
                
                const posX = pyramidCenterX + (x - (layerSize - 1) / 2) * spacing;
                const posY = pyramidCenterY + (y - (layerSize - 1) / 2) * spacing;
                
                baseArchetype.insert({
                    particle: true,
                    position: [posX, posY, layerZ],
                    material: materialId
                });
                
                materialIndex++;
            }
        }
        
        layer++;
    }
}

