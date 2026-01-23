import { Database } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { Vec3, Quat } from "@adobe/data/math";
import { physics } from "./physics/physics.js";
import { Material } from "../types/index.js";
import { MaterialId } from "../types/material/material-id.js";

export const particle = Database.Plugin.create({
    extends: physics,
    components: {
        particle: True.schema,
    },
    archetypes: {
        Particle: ["particle", "position", "material"],
        ParticleScale: ["particle", "position", "material", "scale"],
        ParticleRotation: ["particle", "position", "material", "rotation"],
        ParticleScaleRotation: ["particle", "position", "material", "scale", "rotation"],
    },
    transactions: {
        createParticle(t, props: {
            position: Vec3;
            material: MaterialId;
            scale?: Vec3;
            rotation?: Quat;
        }) {
            // Add optional scale and rotation if provided
            if (props.scale && props.rotation) {
                return t.archetypes.ParticleScaleRotation.insert({
                    particle: true as const,
                    position: props.position,
                    material: props.material,
                    scale: props.scale,
                    rotation: props.rotation,
                });
            }
            if (props.scale) {
                return t.archetypes.ParticleScale.insert({
                    particle: true as const,
                    position: props.position,
                    material: props.material,
                    scale: props.scale,
                });
            }
            if (props.rotation) {
                return t.archetypes.ParticleRotation.insert({
                    particle: true as const,
                    position: props.position,
                    material: props.material,
                    rotation: props.rotation,
                });
            }
            
            return t.archetypes.Particle.insert({
                particle: true as const,
                position: props.position,
                material: props.material,
            });
        },
        createAxis(t) {
            const size = 4; // Extended arm length
            const girth = 0.5;
            
            // Black center cube
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [0, 0, 0],
                scale: [1, 1, 1],
                material: Material.id.metaBlack
            });
            
            // Red particle on X-axis
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [size / 2 + 0.5, 0, 0],
                scale: [size, girth, girth],
                material: Material.id.metaRed
            });
            
            // Green particle on Y-axis
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [0, size / 2 + 0.5, 0],
                scale: [girth, size, girth],
                material: Material.id.metaGreen
            });
            
            // Blue particle on Z-axis
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [0, 0, size / 2 + 0.5],
                scale: [girth, girth, size],
                material: Material.id.metaBlue
            });
        },
        createSampleParticles(t) {
            const spacing = 2.5; // Spacing between particle groups
            const baseY = 3; // Base Y position (top right area)
            const baseZ = 3; // Base Z position (up off the axes)
            const baseX = 0.5; // Slight X offset to be above axes (y/z plane)
            
            // Scale-only particles (y/z plane, top right)
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [baseX, baseY, baseZ],
                material: Material.id.metaRed,
                scale: [2, 1, 1] // Stretched along X
            });
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [baseX, baseY + spacing, baseZ],
                material: Material.id.metaGreen,
                scale: [1, 2, 1] // Stretched along Y
            });
            t.archetypes.ParticleScale.insert({
                particle: true,
                position: [baseX, baseY, baseZ + spacing],
                material: Material.id.metaBlue,
                scale: [1, 1, 2] // Stretched along Z
            });
            
            // Rotation-only particles (y/z plane, top right)
            t.archetypes.ParticleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 2, baseZ],
                material: Material.id.metaRed,
                rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4) // 45° around X
            });
            t.archetypes.ParticleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 2, baseZ + spacing],
                material: Material.id.metaGreen,
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4) // 45° around Y
            });
            t.archetypes.ParticleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 3, baseZ],
                material: Material.id.metaBlue,
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4) // 45° around Z
            });
            
            // Scale + Rotation particles (y/z plane, top right)
            t.archetypes.ParticleScaleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 3, baseZ + spacing],
                material: Material.id.metaRed,
                scale: [2, 0.5, 0.5],
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4)
            });
            t.archetypes.ParticleScaleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 4, baseZ],
                material: Material.id.metaGreen,
                scale: [0.5, 2, 0.5],
                rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 4)
            });
            t.archetypes.ParticleScaleRotation.insert({
                particle: true,
                position: [baseX, baseY + spacing * 4, baseZ + spacing],
                material: Material.id.metaBlue,
                scale: [0.5, 0.5, 2],
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 4)
            });
        },
        createMaterialPyramid(t) {
            // Get all material names (keys from Material.id)
            const materialNames = Object.keys(Material.id) as Array<keyof typeof Material.id>;
            const totalMaterials = materialNames.length;
            
            // Position the pyramid in the x,y plane with +z as up (base at z=0)
            // Located in +x, +y direction to be visible from camera at +x/+y/+z
            const pyramidBaseZ = 0;
            const pyramidCenterX = 8;
            const pyramidCenterY = 8;
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
                        
                        t.archetypes.Particle.insert({
                            particle: true,
                            position: [posX, posY, layerZ],
                            material: materialId
                        });
                        
                        materialIndex++;
                    }
                }
                
                layer++;
            }
        },
    },
})
