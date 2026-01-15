import { Database } from "@adobe/data/ecs";
import { Quat, Vec3 } from "@adobe/data/math";
import { geometry } from "../geometry.js";
import { Volume, Rgba } from "../../types/index.js";

export const voxelVolumes = Database.Plugin.create({
    extends: geometry,
    components: {
        voxelColor: { default: null as unknown as Volume<Rgba> },
        centerOfMass: Vec3.schema,
    },
    archetypes: {
        VoxelVolume: ["position", "scale", "rotation", "voxelColor", "centerOfMass"],
    },
    transactions: {
        createVoxelVolume(t, props: {
            position: Vec3;
            scale: Vec3;
            rotation: Quat;
            voxelColor: Volume<Rgba>;
            centerOfMass?: Vec3;
        }) {
            const centerOfMass = props.centerOfMass ?? Vec3.scale(props.voxelColor.size, 0.5);
            return t.archetypes.VoxelVolume.insert({
                ...props,
                centerOfMass,
            });
        },
    }
});
