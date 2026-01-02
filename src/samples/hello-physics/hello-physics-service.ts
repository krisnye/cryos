import { Database } from "@adobe/data/ecs";
import { voxelVolumeRendering, voxelRendering } from "plugins/index.js";
import { voxelPhysics, helloPhysicsInit, helloPhysicsInput } from "./plugins/index.js";

export function createHelloPhysicsService() {
    return Database.create(
        Database.Plugin.create({
            extends: Database.Plugin.combine(
                voxelRendering,
                voxelVolumeRendering,
                voxelPhysics,
                helloPhysicsInit,
                helloPhysicsInput
            )
        })
    );
}

export type HelloPhysicsService = ReturnType<typeof createHelloPhysicsService>;

