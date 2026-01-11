import { Database } from "@adobe/data/ecs";
import { Vec3, I32 } from "@adobe/data/math";
import { geometry } from "../geometry.js";

export const physics = Database.Plugin.create({
    components: {
        velocity: Vec3.schema,
        material: I32.schema,
    },
    extends: geometry,
});

