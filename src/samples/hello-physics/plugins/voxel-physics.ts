import { Database } from "@adobe/data/ecs";
import { physics } from "plugins/physics/index.js";
import { voxels } from "plugins/voxels.js";

export const voxelPhysics = Database.Plugin.create({
    archetypes: {
        MovingVoxel: [...voxels.archetypes.Voxel, "velocity", "mass"],
    },
    extends: Database.Plugin.combine(voxels, physics),
});

