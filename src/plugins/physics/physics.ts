import { Database } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { geometry } from "../geometry.js";
import { MaterialId } from "types/material/material-id.js";

export const physics = Database.Plugin.create({
    extends: geometry,
    components: {
        velocity: Vec3.schema,
        material: MaterialId.schema,
    },
});

