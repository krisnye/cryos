import { Quat, Vec3 } from "@adobe/data/math";
import { GraphicsStore } from "../graphics-store.js";
import { Rgba, Volume } from "data/index.js";
import { Entity } from "@adobe/data/ecs";

export function createVoxelModel(t: GraphicsStore,
    { id, ...props }: {
        id?: Entity,
        position: Vec3,
        scale: Vec3,
        rotation: Quat,
        voxelColor: Volume<Rgba>,
        centerOfMass?: Vec3,
    }
) {
    if (id) {
        t.update(id, props);
        return id;
    } else {
        return t.archetypes.VoxelModel.insert({ centerOfMass: props.centerOfMass ?? Vec3.scale(props.voxelColor.size, 0.5), ...props });
    }
}