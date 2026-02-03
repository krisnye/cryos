import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/public.js";

/**
 * Creates a mech robot model using DenseVolume<PhysicalVoxel>.
 * Uses technical materials: steel, iron, and meta colors for a futuristic look.
 * 
 * Structure:
 * - Torso: 4x4x6 blocks (steel/iron)
 * - Head: 2x2x2 blocks (metaCyan)
 * - Arms: 1x1x4 blocks each (steel)
 * - Legs: 2x2x4 blocks each (iron)
 * 
 * Total size: 8x8x12 voxels
 */
export const createMechRobot = (): DenseVolume<PhysicalVoxel> => {
    const size: Vec3 = [8, 8, 12];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<PhysicalVoxel> = {
        type: "dense",
        size,
        data: createTypedBuffer(PhysicalVoxel.schema, capacity),
    };

    // Initialize all voxels to air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, PhysicalVoxel.pack(Material.ids.air));
    }
    
    // Material IDs for convenience
    const { air, steel, iron, metaCyan, metaBlue, metaTeal } = Material.ids;
    
    // Torso: 4x4x6 blocks centered in the 8x8 base
    const torsoStartX = 2;
    const torsoStartY = 2;
    const torsoWidth = 4;
    const torsoHeight = 4;
    const torsoDepth = 6;
    const torsoStartZ = 2; // Start at z=2 to leave room for legs
    
    for (let z = torsoStartZ; z < torsoStartZ + torsoDepth; z++) {
        for (let y = torsoStartY; y < torsoStartY + torsoHeight; y++) {
            for (let x = torsoStartX; x < torsoStartX + torsoWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                // Use steel for main body, iron for structural accents
                const material = (x + y + z) % 3 === 0 ? iron : steel;
                volume.data.set(index, PhysicalVoxel.pack(material));
            }
        }
    }
    
    // Head: 2x2x2 blocks on top of torso
    const headStartX = 3;
    const headStartY = 3;
    const headWidth = 2;
    const headHeight = 2;
    const headDepth = 2;
    const headStartZ = torsoStartZ + torsoDepth; // On top of torso
    
    for (let z = headStartZ; z < headStartZ + headDepth; z++) {
        for (let y = headStartY; y < headStartY + headHeight; y++) {
            for (let x = headStartX; x < headStartX + headWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                volume.data.set(index, PhysicalVoxel.pack(metaCyan));
            }
        }
    }
    
    // Left arm: 1x1x4 blocks
    const leftArmX = 1;
    const leftArmY = 3;
    const leftArmWidth = 1;
    const leftArmHeight = 1;
    const leftArmDepth = 4;
    const leftArmStartZ = torsoStartZ + 1; // Slightly below torso top
    
    for (let z = leftArmStartZ; z < leftArmStartZ + leftArmDepth; z++) {
        for (let y = leftArmY; y < leftArmY + leftArmHeight; y++) {
            for (let x = leftArmX; x < leftArmX + leftArmWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                volume.data.set(index, PhysicalVoxel.pack(steel));
            }
        }
    }
    
    // Right arm: 1x1x4 blocks
    const rightArmX = 6;
    const rightArmY = 3;
    const rightArmWidth = 1;
    const rightArmHeight = 1;
    const rightArmDepth = 4;
    const rightArmStartZ = torsoStartZ + 1;
    
    for (let z = rightArmStartZ; z < rightArmStartZ + rightArmDepth; z++) {
        for (let y = rightArmY; y < rightArmY + rightArmHeight; y++) {
            for (let x = rightArmX; x < rightArmX + rightArmWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                volume.data.set(index, PhysicalVoxel.pack(steel));
            }
        }
    }
    
    // Left leg: 2x2x4 blocks
    const leftLegX = 2;
    const leftLegY = 2;
    const leftLegWidth = 2;
    const leftLegHeight = 2;
    const leftLegDepth = 4;
    const leftLegStartZ = 0; // Start at bottom
    
    for (let z = leftLegStartZ; z < leftLegStartZ + leftLegDepth; z++) {
        for (let y = leftLegY; y < leftLegY + leftLegHeight; y++) {
            for (let x = leftLegX; x < leftLegX + leftLegWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                volume.data.set(index, PhysicalVoxel.pack(iron));
            }
        }
    }
    
    // Right leg: 2x2x4 blocks
    const rightLegX = 4;
    const rightLegY = 2;
    const rightLegWidth = 2;
    const rightLegHeight = 2;
    const rightLegDepth = 4;
    const rightLegStartZ = 0; // Start at bottom
    
    for (let z = rightLegStartZ; z < rightLegStartZ + rightLegDepth; z++) {
        for (let y = rightLegY; y < rightLegY + rightLegHeight; y++) {
            for (let x = rightLegX; x < rightLegX + rightLegWidth; x++) {
                const index = DenseVolumeNamespace.getIndex(volume, x, y, z);
                volume.data.set(index, PhysicalVoxel.pack(iron));
            }
        }
    }
    
    // Add some accent details with meta colors
    // Chest plate detail
    const chestX = 3;
    const chestY = 2;
    const chestZ = torsoStartZ + 2;
    const chestIndex = DenseVolumeNamespace.getIndex(volume, chestX, chestY, chestZ);
    volume.data.set(chestIndex, metaBlue);
    
    // Shoulder details
    const leftShoulderX = 1;
    const leftShoulderY = 3;
    const leftShoulderZ = torsoStartZ + 4;
    const leftShoulderIndex = DenseVolumeNamespace.getIndex(volume, leftShoulderX, leftShoulderY, leftShoulderZ);
    volume.data.set(leftShoulderIndex, PhysicalVoxel.pack(metaTeal));
    
    const rightShoulderX = 6;
    const rightShoulderY = 3;
    const rightShoulderZ = torsoStartZ + 4;
    const rightShoulderIndex = DenseVolumeNamespace.getIndex(volume, rightShoulderX, rightShoulderY, rightShoulderZ);
    volume.data.set(rightShoulderIndex, PhysicalVoxel.pack(metaTeal));
    
    return volume;
};

