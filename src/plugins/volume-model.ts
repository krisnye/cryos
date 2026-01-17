import { Database } from "@adobe/data/ecs";
import { Entity } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { Vec3, Quat } from "@adobe/data/math";
import { geometry } from "./geometry.js";
import { MaterialId } from "../types/material/material-id.js";
import { Volume } from "../types/volume/volume.js";
import { materialVertexBuffers } from "./material-vertex-buffers.js";

export const volumeModel = Database.Plugin.create({
    extends: Database.Plugin.combine(geometry, materialVertexBuffers),
    components: {
        volumeModel: True.schema,
        materialVolume: { default: null as unknown as Volume<MaterialId> },
    },
    archetypes: {
        VolumeModel: ["volumeModel", "materialVolume", "position"],
        VolumeModelScale: ["volumeModel", "materialVolume", "position", "scale"],
        VolumeModelRotation: ["volumeModel", "materialVolume", "position", "rotation"],
        VolumeModelScaleRotation: ["volumeModel", "materialVolume", "position", "scale", "rotation"],
    },
    transactions: {
        createVolumeModel(t, props: {
            position: Vec3;
            materialVolume: Volume<MaterialId>;
            scale?: Vec3;
            rotation?: Quat;
        }) {
            // Add optional scale and rotation if provided
            if (props.scale && props.rotation) {
                return t.archetypes.VolumeModelScaleRotation.insert({
                    volumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    scale: props.scale,
                    rotation: props.rotation,
                });
            }
            if (props.scale) {
                return t.archetypes.VolumeModelScale.insert({
                    volumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    scale: props.scale,
                });
            }
            if (props.rotation) {
                return t.archetypes.VolumeModelRotation.insert({
                    volumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    rotation: props.rotation,
                });
            }
            
            return t.archetypes.VolumeModel.insert({
                volumeModel: true,
                position: props.position,
                materialVolume: props.materialVolume,
            });
        },
        setVolumeModel(t, props: {
            entityId: Entity;
            materialVolume: Volume<MaterialId>;
        }) {
            // Update materialVolume and remove buffer components
            // Setting components to undefined removes them from the entity
            t.update(props.entityId, {
                materialVolume: props.materialVolume,
                opaqueVertexBuffer: undefined,
                transparentVertexBuffer: undefined,
            });
        },
    },
});

