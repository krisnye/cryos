import { Database } from "@adobe/data/ecs";
import { Vec3, Vec4, Quat } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { voxelVolumeRendering, cameraControl, voxels, voxelRendering } from "plugins/index.js";
import { Volume } from "../../types/volume/index.js";
import { Rgba } from "../../types/rgba/index.js";

// Helper function to create an interesting test volume (a sphere with color gradient)
function createTestVolume(size: Vec3 = [8, 8, 8]): Volume<Rgba> {
    const elements = size[0] * size[1] * size[2];
    const data = createTypedBuffer(Rgba.schema, elements);
    const volume: Volume<Rgba> = { size, data };
    
    // Center of the sphere
    const centerX = size[0] / 2;
    const centerY = size[1] / 2;
    const centerZ = size[2] / 2;
    const radius = Math.min(size[0], size[1], size[2]) / 2 - 1;
    
    for (let z = 0; z < size[2]; z++) {
        for (let y = 0; y < size[1]; y++) {
            for (let x = 0; x < size[0]; x++) {
                // Calculate distance from center
                const dx = x - centerX;
                const dy = y - centerY;
                const dz = z - centerZ;
                const distSquared = dx * dx + dy * dy + dz * dz;
                const dist = Math.sqrt(distSquared);
                
                // Create a sphere
                if (dist <= radius) {
                    // Create a color gradient based on position
                    // Red at top, green in middle, blue at bottom
                    const normalizedY = (y - centerY) / radius;
                    const r = Math.max(0, Math.min(1, (normalizedY + 1) / 2)); // 0 at bottom, 1 at top
                    const g = Math.max(0, Math.min(1, 1 - Math.abs(normalizedY))); // 1 in middle, 0 at edges
                    const b = Math.max(0, Math.min(1, (1 - normalizedY) / 2)); // 1 at bottom, 0 at top
                    
                    // Add some variation based on distance from center for more visual interest
                    const distFactor = 1 - (dist / radius) * 0.3; // Slightly darker at edges
                    const color: Vec4 = [
                        r * distFactor,
                        g * distFactor,
                        b * distFactor,
                        1.0
                    ];
                    
                    const rgbaColor = Rgba.fromVec4(color);
                    const index = Volume.index(volume, x, y, z);
                    data.set(index, rgbaColor);
                }
            }
        }
    }
    
    return volume;
}

export function createHelloModelService() {
    return Database.create(
        Database.Plugin.create({
            systems: {
                hello_model_init: {
                    create: db => {
                        console.log("initializing test voxel volume");
                        db.transactions.createAxis();
                        
                        // Create a test voxel volume
                        const testVolume = createTestVolume();
                        db.transactions.createVoxelVolume({
                            position: [0, 6, 0],
                            scale: [1, 1, 1],
                            rotation: Quat.identity,
                            voxelColor: testVolume,
                        });
                        
                        // Enable orbit camera control
                        db.store.resources.cameraControlType = "orbit";
                        // this is an init only system so it doesn't return a system function.
                    }
                }
            },
            extends: Database.Plugin.combine(voxelRendering, voxelVolumeRendering, cameraControl)
        })
    );
}

export type HelloModelService = ReturnType<typeof createHelloModelService>;

