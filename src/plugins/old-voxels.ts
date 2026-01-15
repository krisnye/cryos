import { Database } from "@adobe/data/ecs";
import { Quat, Vec4 } from "@adobe/data/math";
import { geometry } from "./geometry.js";
import { True } from "@adobe/data/schema";

export const voxels = Database.Plugin.create({
    extends: geometry,
    components: {
        voxel: True.schema,
        color: Vec4.schema,
    },
    archetypes: {
        Voxel: ["voxel", "position", "color", "scale", "rotation"],
    },
    transactions: {
        createAxis(t) {
            // Black particle at center (no rotation)
            t.archetypes.Voxel.insert({
                voxel: true,
                position: [0, 0, 0],
                color: [0, 0, 0, 1],
                scale: [1, 1, 1],
                rotation: Quat.identity
            });

            const size = 8;
            const girth = 0.35;
            
            // Red particle on X-axis (no rotation - aligned with X)
            t.archetypes.Voxel.insert({
                voxel: true,
                position: [size / 2, 0, 0],
                color: [1, 0, 0, 1],
                scale: [size, girth, girth],
                rotation: Quat.identity
            });
            
            // Green particle on Y-axis (no rotation - aligned with Y)
            t.archetypes.Voxel.insert({
                voxel: true,
                position: [0, size / 2, 0],
                color: [0, 1, 0, 1],
                scale: [girth, size, girth],
                rotation: Quat.identity
            });
            
            // Blue particle on Z-axis
            t.archetypes.Voxel.insert({
                voxel: true,
                position: [0, 0, size / 2],
                color: [0, 0, 1, 1],
                scale: [girth, girth, size],
                rotation: Quat.identity
            });
        },
    }
})
