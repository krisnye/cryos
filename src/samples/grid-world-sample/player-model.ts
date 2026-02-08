import { Database, Entity } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { Vec3, Quat } from "@adobe/data/math";
import { volumeModel } from "../../plugins/volume-model/volume-model.js";
import { Volume } from "../../types/volume/volume.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";

export const playerModel = Database.Plugin.create({
    extends: volumeModel,
    components: {
        player: True.schema,
    },
    archetypes: {
        Player: ["player", "volumeModel", "materialVolume", "position", "rotation"],
    },
    transactions: {
        createPlayer(t, props: {
            position: Vec3;
            materialVolume: Volume<PhysicalVoxel>;
        }) {
            return t.archetypes.Player.insert({
                player: true as const,
                volumeModel: true as const,
                position: props.position,
                materialVolume: props.materialVolume,
                rotation: Quat.identity, // Start facing forward (positive Y)
            });
        },
        movePlayer(t, props: {
            entityId: Entity;
            delta: Vec3;
            terrainHeight?: number;
        }) {
            const currentPosition = t.get(props.entityId, "position");
            if (!currentPosition) {
                return;
            }
            
            // Calculate new position
            const newX = currentPosition[0] + props.delta[0];
            const newY = currentPosition[1] + props.delta[1];
            const newZ = props.terrainHeight ?? (currentPosition[2] + props.delta[2]);
            const newPosition: Vec3 = [newX, newY, newZ];
            
            // TODO: Re-enable rotation once local model translations are implemented
            // Rotation is temporarily disabled because the model needs to be properly
            // positioned relative to its local origin before rotation can be applied correctly.
            // 
            // Calculate rotation to face movement direction (only if moving in X-Y plane)
            // const deltaX = props.delta[0];
            // const deltaY = props.delta[1];
            // const directionLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            // 
            // let rotation: Quat;
            // if (directionLength > 0.001) {
            //     // Normalize direction and calculate angle from positive Y-axis (forward)
            //     const normalizedDir: Vec3 = [deltaX / directionLength, deltaY / directionLength, 0];
            //     // Calculate angle: atan2 gives angle from positive X, but we want from positive Y
            //     const angle = Math.atan2(normalizedDir[0], normalizedDir[1]);
            //     // Rotate around Z-axis (pointing up)
            //     rotation = Quat.fromAxisAngle([0, 0, 1], angle);
            // } else {
            //     // No horizontal movement, keep current rotation or use identity
            //     const currentRotation = t.get(props.entityId, "rotation");
            //     rotation = currentRotation ?? Quat.identity;
            // }
            
            // Update position (rotation update is disabled - see TODO above)
            t.update(props.entityId, { position: newPosition });
        },
        setPlayerPosition(t, props: {
            entityId: Entity;
            position: Vec3;
        }) {
            t.update(props.entityId, { position: props.position });
        },
        setPlayerRotation(t, props: {
            entityId: Entity;
            rotation: Quat;
        }) {
            t.update(props.entityId, { rotation: props.rotation });
        },
    },
});

