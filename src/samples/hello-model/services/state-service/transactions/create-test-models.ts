import { createAxis } from "graphics/database/index.js";
import { HelloModelStore } from "../hello-model-store.js";
import { createCircleModel } from "graphics/database/transactions/create-circle-model.js";
import { Quat } from "@adobe/data/math";
export const createTestModels = (t: HelloModelStore) => {   
    createAxis(t);
    createCircleModel(t, {
        position: [1, 1, 0],
        color: [1, 0, 0, 1],
        radius: 10,
        scale: [0.10, 0.10, 0.10],
        rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 3)
    });
}