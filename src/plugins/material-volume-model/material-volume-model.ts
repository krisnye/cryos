import { Database } from "@adobe/data/ecs";
import { Entity } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { Line3, Vec3, Quat } from "@adobe/data/math";
import { geometry } from "../geometry.js";
import { Volume } from "../../types/volume/volume.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import { materialVertexBuffers } from "../material-vertex-buffers.js";
import { Pick } from "../../types/pick.js";
import { pickMaterialVolumeModels } from "./pick-material-volume-models.js";

export const materialVolumeModel = Database.Plugin.create({
    extends: Database.Plugin.combine(geometry, materialVertexBuffers),
    components: {
        materialVolumeModel: True.schema,
        materialVolume: { default: null as unknown as Volume<PhysicalVoxel> },
    },
    resources: {
        pick: { default: null as unknown as Pick },
    },
    archetypes: {
        MaterialVolumeModel: ["materialVolumeModel", "materialVolume", "position"],
        MaterialVolumeModelScale: ["materialVolumeModel", "materialVolume", "position", "scale"],
        MaterialVolumeModelRotation: ["materialVolumeModel", "materialVolume", "position", "rotation"],
        MaterialVolumeModelScaleRotation: ["materialVolumeModel", "materialVolume", "position", "scale", "rotation"],
    },
    transactions: {
        createMaterialVolumeModel(t, props: {
            position: Vec3;
            materialVolume: Volume<PhysicalVoxel>;
            scale?: Vec3;
            rotation?: Quat;
        }) {
            if (props.scale && props.rotation) {
                return t.archetypes.MaterialVolumeModelScaleRotation.insert({
                    materialVolumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    scale: props.scale,
                    rotation: props.rotation,
                });
            }
            if (props.scale) {
                return t.archetypes.MaterialVolumeModelScale.insert({
                    materialVolumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    scale: props.scale,
                });
            }
            if (props.rotation) {
                return t.archetypes.MaterialVolumeModelRotation.insert({
                    materialVolumeModel: true as const,
                    position: props.position,
                    materialVolume: props.materialVolume,
                    rotation: props.rotation,
                });
            }

            return t.archetypes.MaterialVolumeModel.insert({
                materialVolumeModel: true,
                position: props.position,
                materialVolume: props.materialVolume,
            });
        },
        setMaterialVolumeModel(t, props: {
            entityId: Entity;
            materialVolume: Volume<PhysicalVoxel>;
        }) {
            t.update(props.entityId, {
                materialVolume: props.materialVolume,
                opaqueVertexBuffer: undefined,
                transparentVertexBuffer: undefined,
            });
        },
    },
    systems: {
        material_volume_model_initialize: {
            create: (db) => {
                db.store.resources.pick = (line: Line3) =>
                    pickMaterialVolumeModels(db, line);
            },
        },
    },
});

export type MaterialVolumeModelDatabase = Database.FromPlugin<typeof materialVolumeModel>;
