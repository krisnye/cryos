import { Database } from "@adobe/data/ecs";
import { Quat, Vec3, Vec4 } from "@adobe/data/math";
import { Aabb } from "@adobe/data/math/aabb/index";
import { graphics } from "plugins/graphics.js";

export const geometry = Database.Plugin.create({
    components: {
        position: Vec3.schema,
        rotation: Quat.schema,
        scale: Vec3.schema,
        boundingBox: Aabb.schema,
        color: Vec4.schema,
    },
    extends: graphics
})
