import { Database } from "@adobe/data/ecs";
import { Quat, Vec3, Vec4 } from "@adobe/data/math";
import { Aabb } from "@adobe/data/math";
import { graphics } from "plugins/graphics.js";

export const geometry = Database.Plugin.create({
    extends: graphics,
    components: {
        position: Vec3.schema,
        rotation: Quat.schema,
        scale: Vec3.schema,
        boundingBox: Aabb.schema,
    },
})
