import { Database, Store } from "@adobe/data/ecs";
import { Vec4, Quat, Vec3 } from "@adobe/data/math";
import { geometry } from "./geometry.js";
import { True } from "@adobe/data/schema";

export const voxels = Database.Plugin.create({
    components: {
        voxel: True.schema,
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
        createCircleModel(t, props: {
            position: Vec3,
            scale: Vec3,
            rotation: Quat,
            color: Vec4,
            radius: number,
        }) {
            // Create a circle volume and convert it to individual voxel entities
            const size = [props.radius * 2, props.radius * 2, 1] as Vec3;
            const centerX = props.radius;
            const centerY = props.radius;

            // Generate voxel entities for each pixel in the circle
            for (let x = 0; x < size[0]; x++) {
                for (let y = 0; y < size[1]; y++) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distSquared = dx * dx + dy * dy;
                    
                    if (distSquared <= props.radius * props.radius) {
                        // Convert volume coordinates to world position
                        const voxelLocalPos: Vec3 = [
                            (x - centerX) * props.scale[0] / props.radius,
                            (y - centerY) * props.scale[1] / props.radius,
                            0
                        ];
                        // Rotate the local position by the rotation quaternion
                        const rotatedPos = Quat.rotateVec3(props.rotation, voxelLocalPos);
                        const worldPos: Vec3 = [
                            props.position[0] + rotatedPos[0],
                            props.position[1] + rotatedPos[1],
                            props.position[2] + rotatedPos[2]
                        ];

                        t.archetypes.Voxel.insert({
                            voxel: true,
                            position: worldPos,
                            color: props.color,
                            scale: [
                                props.scale[0] / props.radius,
                                props.scale[1] / props.radius,
                                props.scale[2]
                            ],
                            rotation: props.rotation
                        });
                    }
                }
            }
        },

        createTestModels(t) {
            // Call createAxis transaction
            const transactions = voxels.transactions;
            transactions.createAxis(t);

            // Circle in XY plane (red + green = yellow)
            transactions.createCircleModel(t, {
                position: [0, 0, 0],
                color: [1, 1, 0, 1], // Red + Green = Yellow
                radius: 10,
                scale: [0.10, 0.10, 0.10],
                rotation: Quat.fromAxisAngle([1, 0, 0], (0 * Math.PI / 10)) // Rotate 0° around X-axis
            });

            // Circle in XZ plane (red + blue = magenta)
            transactions.createCircleModel(t, {
                position: [0, 0, 0.1], // Slightly offset in Z to avoid depth conflict
                color: [1, 0, 1, 1], // Red + Blue = Magenta
                radius: 10,
                scale: [0.10, 0.10, 0.10],
                rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 2) // Rotate 90° around X-axis
            });

            // Circle in YZ plane (green + blue = cyan)
            transactions.createCircleModel(t, {
                position: [0, 0, 0.2], // Slightly offset in Z to avoid depth conflict
                color: [0, 1, 1, 1], // Green + Blue = Cyan
                radius: 10,
                scale: [0.10, 0.10, 0.10],
                rotation: Quat.fromAxisAngle([0, 1, 0], -Math.PI / 2) // Rotate -90° around Y-axis to get YZ plane
            });
        },
    },
    extends: geometry
})
